/** @type {import("@commitlint/types").UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow longer subjects so atomic commits can be descriptive.
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
  },
}
