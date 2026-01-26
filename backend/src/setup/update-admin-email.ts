import 'dotenv/config'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import User from '../models/User'
import * as logger from '../utils/logger'

const OLD_ADMIN_EMAIL = 'admin@bookcars.ma'
const NEW_ADMIN_EMAIL = env.ADMIN_EMAIL

try {
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)

  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  if (!NEW_ADMIN_EMAIL) {
    logger.error('BC_ADMIN_EMAIL environment variable is not set')
    process.exit(1)
  }

  // Find the old admin user
  const oldAdminUser = await User.findOne({ 
    email: OLD_ADMIN_EMAIL, 
    type: bookcarsTypes.UserType.Admin 
  })

  if (oldAdminUser) {
    // Update the email
    oldAdminUser.email = NEW_ADMIN_EMAIL
    await oldAdminUser.save()
    logger.info(`Admin email updated from ${OLD_ADMIN_EMAIL} to ${NEW_ADMIN_EMAIL}`)
  } else {
    logger.info(`Admin user with email ${OLD_ADMIN_EMAIL} not found`)
    
    // Check if new admin already exists
    const newAdminUser = await User.findOne({ 
      email: NEW_ADMIN_EMAIL, 
      type: bookcarsTypes.UserType.Admin 
    })
    
    if (newAdminUser) {
      logger.info(`Admin user with email ${NEW_ADMIN_EMAIL} already exists`)
    } else {
      logger.info('No admin user found. Run npm run setup to create a new admin user.')
    }
  }

  process.exit(0)
} catch (err) {
  logger.error('Error during admin email update:', err)
  process.exit(1)
}
