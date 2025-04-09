module.exports = {
  "*.{js,jsx}": [
  "eslint --cache --fix"
],
"*.{ts,tsx}": [
  () => "tsc --project tsconfig.json",
  "eslint --cache --fix"
]
};
