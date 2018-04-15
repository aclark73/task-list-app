/**
 * There must be a user.js file, modeled on this.
 * Used like so:
 * > import user from './user'
 * > github.login(token=user.github.token)
 * The .gitignore includes user.js, so it can be created locally and Git
 * won't bother it.
 */

export default {
  github: {
    token: 'example'
  }
}
