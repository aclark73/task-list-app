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
    token: '0aa4ed5d8c113d5ecba70aa4ed5d8c113d5ecba7'
  },
  redmine: {
    key: '0aa4ed5d8c113d5ecba70aa4ed5d8c113d5ecba7'
  }
}
