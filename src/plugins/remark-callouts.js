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
            
            textNode.value = textNode.value.replace(/^\[!\w+\][ \t]*(.*)?\n?/, '');
            
            if (textNode.value.trim() === '') {
              firstChild.children.shift();
              // If paragraph is now empty, remove it completely
              if (firstChild.children.length === 0) {
                node.children.shift();
              }
            }

            node.children.unshift({
              type: 'paragraph',
              data: {
                hName: 'div',
                hProperties: { className: ['callout-title'] }
              },
              children: [{ type: 'text', value: calloutTitle }]
            });

            node.data = node.data || {};
            node.data.hName = 'div';
            
            let role = 'note';
            if (calloutType === 'warning' || calloutType === 'danger' || calloutType === 'error') role = 'alert';
            else if (calloutType === 'tip' || calloutType === 'success') role = 'status';

            node.data.hProperties = {
              className: ['callout', `callout-${calloutType}`],
              role: role,
            };
          }
        }
      }
    });
  };
}