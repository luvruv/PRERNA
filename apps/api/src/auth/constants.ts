export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'prerna_super_secret_jwt_access_token_key_change_in_prod',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'prerna_super_secret_jwt_refresh_token_key_change_in_prod',
};
