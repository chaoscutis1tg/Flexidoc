import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { AppError } from '../utils/app-error.js';

export class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? (user.organizationId._id || user.organizationId) : null,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  async register({ email, password, fullName, mode, organizationName, orgCode }) {
    if (!email || !password || !fullName) {
      throw new AppError('Vui lòng điền đầy đủ họ tên, email và mật khẩu.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const { User } = await import('../models/user.model.js');
    await User.deleteMany({ email: cleanEmail, deletedAt: { $ne: null } });

    const existingUser = await userRepository.findByEmail(cleanEmail);
    if (existingUser) {
      throw new AppError('Email này đã được đăng ký tài khoản. Vui lòng đăng nhập!', 400);
    }

    let organization = null;
    let role = 'STAFF';

    if (mode === 'JOIN_ORG') {
      if (!orgCode) {
        throw new AppError('Vui lòng nhập Mã Tổ Chức để xin gia nhập.', 400);
      }
      const upperCode = orgCode.trim().toUpperCase();
      organization = await organizationRepository.findByCode(upperCode);
      if (!organization) {
        throw new AppError(`Không tìm thấy Tổ chức với Mã '${upperCode}'. Vui lòng kiểm tra lại mã từ Trưởng tổ chức của bạn!`, 404);
      }
      role = 'STAFF';
    } else {
      // Create New Organization
      if (!organizationName || !organizationName.trim()) {
        throw new AppError('Vui lòng nhập Tên Tổ Chức khi tạo mới.', 400);
      }
      if (!orgCode || !orgCode.trim()) {
        throw new AppError('Vui lòng nhập Mã Tổ Chức khi tạo mới.', 400);
      }
      const name = organizationName.trim();
      const code = orgCode.trim().toUpperCase();
      
      const existingOrg = await organizationRepository.findByCode(code);
      if (existingOrg) {
        throw new AppError(`Mã Tổ chức '${code}' đã được sử dụng. Vui lòng chọn Mã Tổ chức khác!`, 400);
      }

      organization = await organizationRepository.create({
        name,
        code,
        plan: 'FREE',
        status: 'ACTIVE',
        managerName: fullName.trim(),
        managerEmail: email.trim().toLowerCase(),
      });
      role = 'ORGANIZATION_ADMIN';
    }

    const newUser = await userRepository.create({
      email: email.trim().toLowerCase(),
      passwordHash: password,
      fullName: fullName.trim(),
      organizationId: organization._id,
      role,
      authProvider: 'LOCAL',
      status: 'ACTIVE',
    });

    if (organization && role === 'ORGANIZATION_ADMIN') {
      organization.managerUserId = newUser._id;
      await organization.save();
    }

    const populatedUser = await userRepository.findById(newUser._id, null, { populate: 'organizationId' });
    const token = this.generateToken(populatedUser);
    const userObj = populatedUser.toObject();
    delete userObj.passwordHash;

    return { token, user: userObj };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    if (user.status !== 'ACTIVE' || user.deletedAt) {
      throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    user.lastLoginAt = new Date();
    user.authProvider = 'LOCAL';
    await user.save();

    const populatedUser = await userRepository.findById(user._id, null, { populate: 'organizationId' });
    const userObj = populatedUser.toObject();
    delete userObj.passwordHash;

    if (!user.organizationId && user.role !== 'SUPER_ADMIN') {
      return { token: null, user: userObj, requiresOrgSetup: true };
    }

    const token = this.generateToken(populatedUser);

    return { token, user: userObj, requiresOrgSetup: false };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findById(userId, null, { select: '+passwordHash' });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng.', 404);
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không đúng.', 400);
    }

    user.passwordHash = newPassword;
    await user.save();
    return true;
  }

  async loginWithGoogle({ email, fullName, googleId, mode, orgCode, organizationName, accessToken }) {
    if (accessToken && !email) {
      try {
        let googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        let googleData = await googleRes.json();
        if (!googleData || !googleData.email) {
          googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
          googleData = await googleRes.json();
        }
        if (!googleData || !googleData.email) {
          googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${accessToken}`);
          googleData = await googleRes.json();
        }
        if (googleData && googleData.email) {
          email = googleData.email;
          fullName = googleData.name || googleData.given_name || email.split('@')[0];
          googleId = 'GOOGLE_' + (googleData.sub || googleData.user_id || Date.now());
        }
      } catch (err) {
        console.error('Server-side Google UserInfo fetch failed:', err);
      }
    }

    if (!email) {
      throw new AppError('Vui lòng cung cấp Email tài khoản Google.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || cleanEmail.split('@')[0]).trim();

    const { User } = await import('../models/user.model.js');
    const { Organization } = await import('../models/organization.model.js');

    // Purge any old soft-deleted user record with this email so it never blocks lookup
    await User.deleteMany({ email: cleanEmail, deletedAt: { $ne: null } });

    // Look up user directly in MongoDB collection
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Re-activate user if it was inactive/deleted
      user.deletedAt = null;
      if (user.status === 'LOCKED') {
        user.status = 'ACTIVE';
      }
      user.lastLoginAt = new Date();
      user.authProvider = 'GOOGLE';
      if (googleId) user.googleId = googleId;

      // Verify if user's assigned organization is still active (not deleted)
      let validOrg = null;
      if (user.organizationId) {
        const orgId = user.organizationId._id || user.organizationId;
        validOrg = await Organization.findOne({ _id: orgId, deletedAt: null });
      }

      if (validOrg) {
        user.organizationId = validOrg._id;
        await user.save();

        const populatedUser = await userRepository.findById(user._id, null, { populate: 'organizationId' });
        const token = this.generateToken(populatedUser);
        const userObj = populatedUser.toObject();
        delete userObj.passwordHash;
        return { token, user: userObj, requiresOrgSetup: false };
      } else {
        // User has no org or their org was deleted -> Prompt user for Org Setup (Create or Join)
        user.organizationId = null;
        await user.save();

        const userObj = user.toObject();
        delete userObj.passwordHash;
        return { token: null, user: userObj, requiresOrgSetup: true };
      }
    } else {
      // User is brand new
      let organization = null;
      let role = 'STAFF';

      if (mode === 'JOIN_ORG' && orgCode) {
        const upperCode = orgCode.trim().toUpperCase();
        organization = await Organization.findOne({ code: upperCode, deletedAt: null });
        if (organization) {
          role = 'STAFF';
        }
      } else if (organizationName && orgCode) {
        const name = organizationName.trim();
        const code = orgCode.trim().toUpperCase();
        const existingOrg = await Organization.findOne({ code, deletedAt: null });
        if (!existingOrg) {
          organization = await organizationRepository.create({
            name,
            code,
            plan: 'FREE',
            status: 'ACTIVE',
          });
          role = 'ORGANIZATION_ADMIN';
        }
      }

      user = await userRepository.create({
        email: cleanEmail,
        passwordHash: 'GOOGLE_OAUTH_PWD_' + Math.random().toString(36).substring(2),
        fullName: cleanName,
        organizationId: organization ? organization._id : null,
        role: organization ? role : 'STAFF',
        authProvider: 'GOOGLE',
        status: 'ACTIVE',
        googleId: googleId || 'GOOGLE_' + Date.now(),
      });

      if (organization) {
        const populatedUser = await userRepository.findById(user._id, null, { populate: 'organizationId' });
        const token = this.generateToken(populatedUser);
        const userObj = populatedUser.toObject();
        delete userObj.passwordHash;
        return { token, user: userObj, requiresOrgSetup: false };
      } else {
        // Prompt user for Org Setup (Create or Join)
        const userObj = user.toObject();
        delete userObj.passwordHash;
        return { token: null, user: userObj, requiresOrgSetup: true };
      }
    }
    delete userObj.passwordHash;

    return { token, user: userObj, requiresOrgSetup: false };
  }

  async setupGoogleOrganization({ userId, email, mode, organizationName, orgCode }) {
    let user = null;
    if (userId) {
      user = await userRepository.findById(userId);
    }
    if (!user && email) {
      user = await userRepository.findByEmail(email.trim().toLowerCase());
    }
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng.', 404);
    }

    // If user already has an organization, return token directly
    if (user.organizationId) {
      const populatedUser = await userRepository.findById(user._id, null, { populate: 'organizationId' });
      const token = this.generateToken(populatedUser);
      const userObj = populatedUser.toObject();
      delete userObj.passwordHash;
      return { token, user: userObj };
    }

    let organization = null;
    let role = 'STAFF';

    if (mode === 'JOIN_ORG') {
      if (!orgCode || !orgCode.trim()) {
        throw new AppError('Vui lòng nhập Mã Tổ Chức để gia nhập.', 400);
      }
      const upperCode = orgCode.trim().toUpperCase();
      organization = await organizationRepository.findByCode(upperCode);
      if (!organization) {
        throw new AppError(`Không tìm thấy Tổ chức với Mã '${upperCode}'. Vui lòng kiểm tra lại mã từ Trưởng tổ chức của bạn!`, 404);
      }
      role = 'STAFF';
    } else {
      if (!organizationName || !organizationName.trim()) {
        throw new AppError('Vui lòng nhập Tên Công Ty / Tổ Chức Mới.', 400);
      }
      if (!orgCode || !orgCode.trim()) {
        throw new AppError('Vui lòng nhập Mã Tổ Chức khi tạo mới.', 400);
      }
      const name = organizationName.trim();
      const code = orgCode.trim().toUpperCase();
      
      const existingOrg = await organizationRepository.findByCode(code);
      if (existingOrg) {
        throw new AppError(`Mã Tổ chức '${code}' đã được sử dụng. Vui lòng chọn Mã Tổ chức khác!`, 400);
      }

      organization = await organizationRepository.create({
        name,
        code,
        plan: 'FREE',
        status: 'ACTIVE',
        managerName: user.fullName,
        managerEmail: user.email ? user.email.toLowerCase().trim() : '',
        managerUserId: user._id,
      });
      role = 'ORGANIZATION_ADMIN';
    }

    user.organizationId = organization._id;
    user.role = role;
    user.authProvider = 'GOOGLE';
    await user.save();

    const populatedUser = await userRepository.findById(user._id, null, { populate: 'organizationId' });
    const token = this.generateToken(populatedUser);
    const userObj = populatedUser.toObject();
    delete userObj.passwordHash;

    return { token, user: userObj };
  }

  async checkOrgCode(code) {
    if (!code) return { exists: false, code: '' };
    const upperCode = code.trim().toUpperCase();
    const existingOrg = await organizationRepository.findByCode(upperCode);
    if (existingOrg) {
      return { exists: true, orgName: existingOrg.name, code: upperCode };
    }
    return { exists: false, code: upperCode };
  }
}

export const authService = new AuthService();
