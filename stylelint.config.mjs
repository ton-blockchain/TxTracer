/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-config-css-modules"],
  rules: {
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    "property-no-deprecated": null,
    "no-descending-specificity": null,
    "keyframes-name-pattern": null,
    "declaration-property-value-keyword-no-deprecated": null,
    "selector-pseudo-class-no-unknown": null, // :global()
    "custom-property-empty-line-before": null,
    "declaration-empty-line-before": null,
    "comment-empty-line-before": null,
    "no-duplicate-selectors": null,

    "value-keyword-case": [
      "lower",
      {
        ignoreProperties: ["composes", "compose-with"],
      },
    ],
  },
}
