import { BaseRepository } from './base.repository.js';
import { User } from '../models/user.model.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, includePassword = false) {
    const query = this.model.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (includePassword) query.select('+passwordHash');
    return await query.populate('organizationId').exec();
  }
}

export const userRepository = new UserRepository();
