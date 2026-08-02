export const enforceTargetBlankRelRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce rel='noopener' or rel='noopener noreferrer' on target='_blank' links",
    },
    schema: [], // No additional options required
  },
  create(context) {
    return {
      JSXElement(node) {
        // Only inspect standard <a> tags
        if (node.openingElement.name.name !== "a") return;

        const attributes = node.openingElement.attributes;
        const targetAttr = attributes.find((attr) => attr.name?.name === "target");
        const relAttr = attributes.find((attr) => attr.name?.name === "rel");

        // Check if the link opens in a new tab
        if (targetAttr && targetAttr.value?.value === "_blank") {
          const relValue = relAttr?.value?.value || "";

          if (!relAttr || !relValue.includes("noopener")) {
            context.report({
              node,
              message:
                "Links with target='_blank' must include rel='noopener' or rel='noopener noreferrer'.",
            });
          }
        }
      },
    };
  },
};