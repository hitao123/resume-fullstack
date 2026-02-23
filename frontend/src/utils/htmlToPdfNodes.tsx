import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';

interface HtmlToPdfOptions {
  baseStyle?: Style;
  boldStyle?: Style;
  italicStyle?: Style;
}

/**
 * 将有限 HTML 子集（p/strong/em/ul/ol/li/br）转换为 @react-pdf/renderer 节点。
 * 纯文本输入直接返回 <Text>（向后兼容）。
 */
export function htmlToPdfNodes(
  html: string | undefined,
  options: HtmlToPdfOptions = {},
): React.ReactNode {
  if (!html) return null;

  const {
    baseStyle = {},
    boldStyle = { fontWeight: 'bold' as const },
    italicStyle = { fontStyle: 'italic' as const },
  } = options;

  // 纯文本（无 HTML 标签）直接返回
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return <Text style={baseStyle}>{html}</Text>;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  let olCounter = 0;

  function renderInlineChildren(node: Node, keyPrefix: string): React.ReactNode[] {
    return Array.from(node.childNodes)
      .map((child, i) => renderNode(child, `${keyPrefix}-${i}`, true))
      .filter(Boolean);
  }

  function renderNode(node: Node, key: string, inline = false): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || null;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case 'p': {
        const children = renderInlineChildren(el, key);
        // li 内的 <p> 不加额外 margin，避免列表项间距过大
        if (inline) {
          return <React.Fragment key={key}>{children}</React.Fragment>;
        }
        return (
          <Text key={key} style={{ ...baseStyle, marginBottom: 3 }}>
            {children}
          </Text>
        );
      }
      case 'strong':
      case 'b':
        return (
          <Text key={key} style={boldStyle}>
            {renderInlineChildren(el, key)}
          </Text>
        );
      case 'em':
      case 'i':
        return (
          <Text key={key} style={italicStyle}>
            {renderInlineChildren(el, key)}
          </Text>
        );
      case 'br':
        return <Text key={key}>{'\n'}</Text>;
      case 'ul': {
        const items = Array.from(el.childNodes).map((child, i) => {
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            (child as Element).tagName.toLowerCase() === 'li'
          ) {
            return renderListItem(child as Element, `${key}-li-${i}`, '\u2022');
          }
          return null;
        });
        return (
          <View key={key} style={{ marginLeft: 8, marginTop: 3, marginBottom: 3 }}>
            {items}
          </View>
        );
      }
      case 'ol': {
        olCounter = 0;
        const items = Array.from(el.childNodes).map((child, i) => {
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            (child as Element).tagName.toLowerCase() === 'li'
          ) {
            olCounter++;
            return renderListItem(child as Element, `${key}-li-${i}`, `${olCounter}.`);
          }
          return null;
        });
        return (
          <View key={key} style={{ marginLeft: 8, marginTop: 3, marginBottom: 3 }}>
            {items}
          </View>
        );
      }
      case 'li':
        return renderListItem(el, key, '\u2022');
      default:
        return (
          <Text key={key}>{renderInlineChildren(el, key)}</Text>
        );
    }
  }

  function renderListItem(el: Element, key: string, marker: string): React.ReactNode {
    const children = renderInlineChildren(el, key);
    return (
      <View key={key} style={{ flexDirection: 'row', marginBottom: 2, alignItems: 'flex-start' }}>
        <Text style={{ ...baseStyle, width: 16, textAlign: 'right' as const, marginRight: 4 }}>
          {marker}
        </Text>
        <Text style={{ ...baseStyle, flex: 1 }}>
          {children}
        </Text>
      </View>
    );
  }

  const nodes = Array.from(body.childNodes)
    .map((child, i) => renderNode(child, `r-${i}`))
    .filter(Boolean);

  return <View>{nodes}</View>;
}
