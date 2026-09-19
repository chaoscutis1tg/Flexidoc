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

    const existingUser = await userRepository.findByEmail(email.trim().toLowerCase());
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
      const name = organizationName ? organizationName.trim() : `Tổ chức ${fullName.trim()}`;
      let code = orgCode ? orgCode.trim().toUpperCase() : ('ORG-' + Math.floor(10000 + Math.random() * 90000));
      
      const existingOrg = await organizationRepository.findByCode(code);
      if (existingOrg) {
        throw new AppError(`Mã Tổ chức '${code}' đã được sử dụng. Vui lòng chọn Mã Tổ chức khác!`, 400);
      }

      organization = await organizationRepository.create({
        name,
        code,
        plan: 'FREE',
        status: 'ACTIVE',
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
    const token = this.generateToken(populatedUser);
    const userObj = populatedUser.toObject();
    delete userObj.passwordHash;

    return { token, user: userObj };
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

  async loginWithGoogle({ email, fullName, googleId, mode, orgCode, organizationName }) {
    if (!email) {
      throw new AppError('Vui lòng cung cấp Email tài khoản Google.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || cleanEmail.split('@')[0]).trim();

    let user = await userRepository.findByEmail(cleanEmail, false);

    if (user) {
      if (user.status !== 'ACTIVE' || user.deletedAt) {
        throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.', 401);
      }
      user.lastLoginAt = new Date();
      user.authProvider = 'GOOGLE';
      if (googleId) user.googleId = googleId;
      await user.save();

      if (!user.organizationId) {
        const userObj = user.toObject();
        delete userObj.passwordHash;
        return { token: null, user: userObj, requiresOrgSetup: true };
      }
    } else {
      if (mode) {
        let organization = null;
        let role = 'STAFF';

        if (mode === 'JOIN_ORG' && orgCode) {
          const upperCode = orgCode.trim().toUpperCase();
          organization = await organizationRepository.findByCode(upperCode);
          if (!organization) {
            throw new AppError(`Không tìm thấy Tổ chức với Mã '${upperCode}'. Vui lòng kiểm tra lại mã gia nhập!`, 404);
          }
          role = 'STAFF';
        } else {
          const name = organizationName ? organizationName.trim() : `Tổ chức ${cleanName}`;
          const randomCode = 'ORG-' + Math.floor(10000 + Math.random() * 90000);
          
          organization = await organizationRepository.create({
            name,
            code: randomCode,
            plan: 'FREE',
            status: 'ACTIVE',
          });
          role = 'ORGANIZATION_ADMIN';
        }

        user = await userRepository.create({
          email: cleanEmail,
          passwordHash: 'GOOGLE_OAUTH_PWD_' + Math.random().toString(36).substring(2),
          fullName: cleanName,
          organizationId: organization._id,
          role,
          authProvider: 'GOOGLE',
          status: 'ACTIVE',
          googleId: googleId || 'GOOGLE_' + Date.now(),
        });
      } else {
        // Create initial Google user without Organization -> Trigger Onboarding Modal
        user = await userRepository.create({
          email: cleanEmail,
          passwordHash: 'GOOGLE_OAUTH_PWD_' + Math.random().toString(36).substring(2),
          fullName: cleanName,
          organizationId: null,
          role: 'STAFF',
          authProvider: 'GOOGLE',
          status: 'ACTIVE',
          googleId: googleId || 'GOOGLE_' + Date.now(),
        });

        const userObj = user.toObject();
        delete userObj.passwordHash;
        return { token: null, user: userObj, requiresOrgSetup: true };
      }
    }

    const populatedUser = await userRepository.findById(user._id, null, { populate: 'organizationId' });
    const token = this.generateToken(populatedUser);
    const userObj = populatedUser.toObject();
    delete userObj.passwordHash;

    return { token, user: userObj, requiresOrgSetup: false };
  }

  async setupGoogleOrganization({ userId, mode, organizationName, orgCode }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng.', 404);
    }

    let organization = null;
    let role = 'STAFF';

    if (mode === 'JOIN_ORG') {
      if (!orgCode) {
        throw new AppError('Vui lòng nhập Mã Tổ Chức để gia nhập.', 400);
      }
      const upperCode = orgCode.trim().toUpperCase();
      organization = await organizationRepository.findByCode(upperCode);
      if (!organization) {
        throw new AppError(`Không tìm thấy Tổ chức với Mã '${upperCode}'. Vui lòng kiểm tra lại mã từ Trưởng tổ chức của bạn!`, 404);
      }
      role = 'STAFF';
    } else {
      const name = organizationName ? organizationName.trim() : `Tổ chức ${user.fullName}`;
      let code = orgCode ? orgCode.trim().toUpperCase() : ('ORG-' + Math.floor(10000 + Math.random() * 90000));
      
      const existingOrg = await organizationRepository.findByCode(code);
      if (existingOrg) {
        throw new AppError(`Mã Tổ chức '${code}' đã được sử dụng. Vui lòng chọn Mã Tổ chức khác!`, 400);
      }

      organization = await organizationRepository.create({
        name,
        code,
        plan: 'FREE',
        status: 'ACTIVE',
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
