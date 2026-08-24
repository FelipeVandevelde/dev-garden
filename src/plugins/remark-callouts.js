import { visit } from 'unist-util-visit';

export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const firstChild = node.children[0];
      if (firstChild && firstChild.type === 'paragraph') {
        const textNode = firstChild.children[0];
        if (textNode && textNode.type === 'text') {
          const match = textNode.value.match(/^\[!(\w+)\][ \t]*(.*)?/);
          if (match) {
            const calloutType = match[1].toLowerCase();
            const calloutTitle = match[2] || calloutType.toUpperCase();
            
            // Remove the [!TYPE] text
            textNode.value = textNode.value.replace(/^\[!\w+\][ \t]*(.*)?\n?/, '');
            
            if (textNode.value.trim() === '') {
              firstChild.children.shift();
            }

            // Prepend title div
            node.children.unshift({
              type: 'paragraph',
              data: {
                hName: 'div',
                hProperties: { className: ['callout-title'] }
              },
              children: [{ type: 'text', value: calloutTitle }]
            });

            // Morph blockquote to div
            node.data = node.data || {};
            node.data.hName = 'div';
            node.data.hProperties = {
              className: ['callout', `callout-${calloutType}`],
              role: calloutType === 'warning' ? 'alert' : 'note',
            };
          }
        }
      }
    });
  };
}