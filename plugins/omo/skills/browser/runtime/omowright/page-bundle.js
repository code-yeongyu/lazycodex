(function () {
  const ROLE_MAP = {
    a: "link",
    button: "button",
    iframe: "iframe",
    select: "combobox",
    textarea: "textbox",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    canvas: "canvas",
    svg: "image",
    img: "image",
    nav: "navigation",
    main: "main",
    header: "banner",
    footer: "contentinfo",
    section: "region",
    article: "article",
    aside: "complementary",
    form: "form",
    table: "table",
    ul: "list",
    ol: "list",
    li: "listitem",
    p: "paragraph",
    label: "label",
  };
  const VALID_ARIA_ROLES = /* @__PURE__ */ new Set([
    "alert",
    "alertdialog",
    "application",
    "article",
    "banner",
    "blockquote",
    "button",
    "caption",
    "cell",
    "checkbox",
    "code",
    "columnheader",
    "combobox",
    "complementary",
    "contentinfo",
    "definition",
    "deletion",
    "dialog",
    "directory",
    "document",
    "emphasis",
    "feed",
    "figure",
    "form",
    "generic",
    "grid",
    "gridcell",
    "group",
    "heading",
    "img",
    "insertion",
    "link",
    "list",
    "listbox",
    "listitem",
    "log",
    "main",
    "mark",
    "marquee",
    "math",
    "meter",
    "menu",
    "menubar",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "navigation",
    "none",
    "note",
    "option",
    "paragraph",
    "presentation",
    "progressbar",
    "radio",
    "radiogroup",
    "region",
    "row",
    "rowgroup",
    "rowheader",
    "scrollbar",
    "search",
    "searchbox",
    "separator",
    "slider",
    "spinbutton",
    "status",
    "strong",
    "subscript",
    "superscript",
    "switch",
    "tab",
    "table",
    "tablist",
    "tabpanel",
    "term",
    "textbox",
    "time",
    "timer",
    "toolbar",
    "tooltip",
    "tree",
    "treegrid",
    "treeitem",
  ]);
  function getExplicitAriaRole(element) {
    return (
      (element.getAttribute("role") || "")
        .split(" ")
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean)
        .find((role) => VALID_ARIA_ROLES.has(role)) || null
    );
  }
  function isContentEditableElement(element) {
    if (!(element instanceof HTMLElement)) return false;
    return element.contentEditable === "true" || element.contentEditable === "plaintext-only";
  }
  function getImplicitRole(element) {
    const tag = element.tagName.toLowerCase();
    const type = element.getAttribute("type");
    if (isContentEditableElement(element)) return "textbox";
    if (tag === "input") {
      if (type === "submit" || type === "button") return "button";
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "file") return "button";
      return "textbox";
    }
    return ROLE_MAP[tag] || "generic";
  }
  function getRole(element) {
    const explicitRole = getExplicitAriaRole(element);
    if (!explicitRole) return getImplicitRole(element);
    if (explicitRole === "presentation" || explicitRole === "none") return getImplicitRole(element);
    return explicitRole;
  }
  const INTERACTIVE_TAGS = /* @__PURE__ */ new Set([
    "a",
    "button",
    "input",
    "select",
    "textarea",
    "details",
    "summary",
  ]);
  // Longest label an interactive read keeps for a clickable generic; matches normalizeName.
  const INTERACTIVE_LABEL_MAX = 100;
  // Roles that are live regions by default; their text is state feedback an interactive read keeps.
  const LIVE_REGION_ROLES = /* @__PURE__ */ new Set(["alert", "alertdialog", "status", "log", "timer", "marquee"]);
  // The live region an element sits in: the nearest ancestor (or the element itself) that sets
  // aria-live polite/assertive or has a live role, or null outside one. An explicit aria-live wins on
  // its own element, so aria-live="off" opts out; an invalid value counts as unset, as in ARIA.
  function getLiveRegionRoot(element) {
    for (let current = element; current; current = getParentElementAcrossShadowBoundary(current)) {
      const live = (current.getAttribute("aria-live") || "").trim().toLowerCase();
      if (live === "polite" || live === "assertive") return current;
      if (live === "off") return null;
      if (LIVE_REGION_ROLES.has(getRole(current))) return current;
    }
    return null;
  }
  // True when `ancestor` is `element` itself or one of its ancestors, across shadow boundaries.
  function isSelfOrAncestor(ancestor, element) {
    for (let current = element; current; current = getParentElementAcrossShadowBoundary(current))
      if (current === ancestor) return true;
    return false;
  }
  const INTERACTIVE_REF_ROLES = /* @__PURE__ */ new Set([
    "button",
    "link",
    "textbox",
    "checkbox",
    "radio",
    "combobox",
    "listbox",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "searchbox",
    "slider",
    "spinbutton",
    "switch",
    "tab",
    "treeitem",
  ]);
  const CONTENT_REF_ROLES = /* @__PURE__ */ new Set([
    "cell",
    "gridcell",
    "columnheader",
    "rowheader",
    "listitem",
    "article",
    "region",
    "main",
    "navigation",
  ]);
  const ARIA_LEVEL_ROLES = /* @__PURE__ */ new Set(["heading", "listitem", "row", "treeitem"]);
  const ARIA_SELECTED_ROLES = /* @__PURE__ */ new Set([
    "gridcell",
    "option",
    "row",
    "tab",
    "rowheader",
    "columnheader",
    "treeitem",
  ]);
  const ARIA_CHECKED_ROLES = /* @__PURE__ */ new Set([
    "checkbox",
    "radio",
    "menuitemcheckbox",
    "menuitemradio",
    "switch",
  ]);
  /** Roles where `aria-readonly` is meaningful for editability checks. */
  const ARIA_READONLY_ROLES = /* @__PURE__ */ new Set([
    "checkbox",
    "combobox",
    "grid",
    "gridcell",
    "listbox",
    "radiogroup",
    "slider",
    "spinbutton",
    "textbox",
    "columnheader",
    "rowheader",
    "searchbox",
    "switch",
    "treegrid",
  ]);
  const ARIA_DISABLED_ROLES = /* @__PURE__ */ new Set([
    "application",
    "button",
    "composite",
    "gridcell",
    "group",
    "input",
    "link",
    "menuitem",
    "scrollbar",
    "separator",
    "tab",
    "checkbox",
    "columnheader",
    "combobox",
    "grid",
    "listbox",
    "menu",
    "menubar",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "radio",
    "radiogroup",
    "row",
    "rowheader",
    "searchbox",
    "select",
    "slider",
    "spinbutton",
    "switch",
    "tablist",
    "textbox",
    "toolbar",
    "tree",
    "treegrid",
    "treeitem",
  ]);
  const NATIVE_HEADING_LEVELS = {
    h1: 1,
    h2: 2,
    h3: 3,
    h4: 4,
    h5: 5,
    h6: 6,
  };
  /** */
  function getAriaLevel(element, role) {
    if (!ARIA_LEVEL_ROLES.has(role)) return void 0;
    const tag = element.tagName.toLowerCase();
    if (role === "heading") {
      const nativeLevel = NATIVE_HEADING_LEVELS[tag];
      if (nativeLevel) return nativeLevel;
    }
    const ariaLevel = Number(element.getAttribute("aria-level"));
    if (Number.isInteger(ariaLevel) && ariaLevel >= 1) return ariaLevel;
  }
  const LANDMARK_TAGS = /* @__PURE__ */ new Set([
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "nav",
    "main",
    "header",
    "footer",
    "section",
    "article",
    "aside",
  ]);
  const SKIP_TAGS = /* @__PURE__ */ new Set(["script", "style", "meta", "link", "title", "noscript"]);
  function getAriaBoolean(attr) {
    if (attr === null) return void 0;
    return attr.toLowerCase() === "true";
  }
  /** Escape double quotes and newlines in text. */
  const escapeSnapshotText = (text) => text.replace(/"/g, '\\"').replace(/\n/g, "\\n");
  /** Replace consecutive whitespace characters with a single space and trim the result. */
  const normalizeWhitespace = (text) => text.trim();
  function shouldInsertSpaceBetween(left, right) {
    const trimmedLeft = left.trimEnd();
    const trimmedRight = right.trimStart();
    if (!trimmedLeft || !trimmedRight) return false;
    return /[\p{L}\p{N}]$/u.test(trimmedLeft) && /^[\p{L}\p{N}]/u.test(trimmedRight);
  }
  /** Merge adjacent strings with whitespace normalization and boundary-safe spacing. */
  function mergeStringBuffer(buffer) {
    let merged = "";
    for (const part of buffer) {
      if (!part) continue;
      if (!merged) {
        merged = part;
        continue;
      }
      if (shouldInsertSpaceBetween(merged, part)) merged += " ";
      merged += part;
    }
    return normalizeWhitespace(merged);
  }
  function getCSSContent(element, pseudo) {
    try {
      const style = window.getComputedStyle(element, pseudo);
      if (!style) return "";
      if (style.display === "none" || style.visibility === "hidden") return "";
      const content = (style.content || "").trim();
      if (!content || content === "none" || content === "normal") return "";
      const matches = [...content.matchAll(/"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g)];
      if (!matches.length) return "";
      return matches
        .map((match) => match[1] ?? match[2] ?? "")
        .map((text) =>
          text
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "	")
            .replace(/\\f/g, "\f")
            .replace(/\\(["'\\])/g, "$1"),
        )
        .join("");
    } catch {
      return "";
    }
  }
  let _cache;
  let _cacheHidden;
  /** Start per-snapshot caching. Call at beginning of generateAccessibilityTree. */
  function beginAccNameCaches() {
    _cache = /* @__PURE__ */ new Map();
    _cacheHidden = /* @__PURE__ */ new Map();
  }
  /** End per-snapshot caching. Call in finally block after generateAccessibilityTree. */
  function endAccNameCaches() {
    _cache = void 0;
    _cacheHidden = void 0;
  }
  const NAME_FROM_CONTENT_ROLES = /* @__PURE__ */ new Set([
    "button",
    "link",
    "heading",
    "cell",
    "columnheader",
    "rowheader",
    "tooltip",
    "tab",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "treeitem",
    "option",
    "listitem",
    "row",
    "term",
  ]);
  const PROHIBITS_NAMING = /* @__PURE__ */ new Set([
    "caption",
    "code",
    "definition",
    "deletion",
    "emphasis",
    "generic",
    "insertion",
    "mark",
    "paragraph",
    "presentation",
    "strong",
    "subscript",
    "superscript",
    "term",
    "time",
  ]);
  function getIdRefs(element, attrValue) {
    if (!attrValue) return [];
    const doc = element.ownerDocument;
    return attrValue
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => doc.getElementById(id))
      .filter(Boolean);
  }
  function isHiddenForAria(element) {
    if (element.getAttribute("aria-hidden") === "true") return true;
    try {
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return true;
    } catch {}
    return false;
  }
  function getLabels(element) {
    const labels = [];
    const id = element.getAttribute("id");
    if (id) {
      const forLabels = element.ownerDocument.querySelectorAll(`label[for="${id.replace(/"/g, '\\"')}"]`);
      labels.push(...Array.from(forLabels));
    }
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === "label") {
        labels.push(parent);
        break;
      }
      parent = parent.parentElement;
    }
    return labels;
  }
  const MAX_ACCNAME_DEPTH = 10;
  function getAccNameInternal(element, opts) {
    if (opts.depth >= MAX_ACCNAME_DEPTH) return "";
    if (opts.visitedElements.has(element)) return "";
    opts.visitedElements.add(element);
    if (!opts.includeHidden && !opts.inLabelledBy && !opts.inLabel) {
      if (isHiddenForAria(element)) return "";
    }
    if (!opts.inLabelledBy) {
      const refs = getIdRefs(element, element.getAttribute("aria-labelledby"));
      if (refs.length) {
        const name = refs
          .map((ref) =>
            getAccNameInternal(ref, {
              ...opts,
              depth: opts.depth + 1,
              visitedElements: new Set(opts.visitedElements),
              inLabelledBy: true,
            }),
          )
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (name) return name;
      }
    }
    const ariaLabel = element.getAttribute("aria-label")?.trim();
    if (ariaLabel) return ariaLabel;
    const role = getRole(element);
    const tag = element.tagName.toLowerCase();
    if (
      ["input", "textarea", "select", "meter", "progress", "output"].includes(tag) &&
      !opts.inLabel &&
      !opts.inLabelledBy
    ) {
      const labels = getLabels(element);
      if (labels.length) {
        const name = labels
          .map((lbl) =>
            getAccNameInternal(lbl, {
              ...opts,
              depth: opts.depth + 1,
              visitedElements: new Set(opts.visitedElements),
              inLabel: true,
            }),
          )
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (name) return name;
      }
    }
    if (tag === "area" || tag === "img" || (tag === "input" && element.getAttribute("type") === "image")) {
      const alt = element.getAttribute("alt");
      if (alt !== null) return alt.trim();
    }
    if (tag === "fieldset") {
      const legend = element.querySelector(":scope > legend");
      if (legend)
        return getAccNameInternal(legend, {
          ...opts,
          depth: opts.depth + 1,
          visitedElements: new Set(opts.visitedElements),
        });
    }
    if (tag === "figure") {
      const figcaption = element.querySelector(":scope > figcaption");
      if (figcaption)
        return getAccNameInternal(figcaption, {
          ...opts,
          depth: opts.depth + 1,
          visitedElements: new Set(opts.visitedElements),
        });
    }
    if (tag === "table") {
      const caption = element.querySelector(":scope > caption");
      if (caption)
        return getAccNameInternal(caption, {
          ...opts,
          depth: opts.depth + 1,
          visitedElements: new Set(opts.visitedElements),
        });
    }
    if (tag === "select") {
      const sel = element;
      const selected = sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      if (selected) return selected.textContent?.trim() || "";
    }
    if (NAME_FROM_CONTENT_ROLES.has(role) || opts.inLabelledBy || opts.inLabel) {
      const parts = [];
      const before = getCSSContent(element, "::before");
      if (before) parts.push(before);
      for (const child of element.childNodes)
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || "";
          if (text) parts.push(text);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childText = getAccNameInternal(child, {
            ...opts,
            depth: opts.depth + 1,
            visitedElements: new Set(opts.visitedElements),
          });
          if (childText) parts.push(childText);
        }
      const after = getCSSContent(element, "::after");
      if (after) parts.push(after);
      const text = parts.join("").replace(/\s+/g, " ").trim();
      if (text) return text;
    }
    if (tag === "input") {
      const type = (element.getAttribute("type") || "text").toLowerCase();
      if (type === "submit" || type === "button") {
        const val = element.value;
        if (val?.trim()) return val.trim();
      }
    }
    const placeholder = element.getAttribute("placeholder")?.trim();
    if (placeholder) return placeholder;
    const title = element.getAttribute("title")?.trim();
    if (title) return title;
    return "";
  }
  /**
   * Compute the W3C-compliant accessible name for an element.
   * Cached within a snapshot call when used with beginAccNameCaches/endAccNameCaches.
   */
  function getAccessibleName(element, includeHidden = false) {
    const cache = includeHidden ? _cacheHidden : _cache;
    if (cache) {
      const cached = cache.get(element);
      if (cached !== void 0) return cached;
    }
    const role = getRole(element);
    let name = "";
    if (!PROHIBITS_NAMING.has(role))
      name = getAccNameInternal(element, {
        includeHidden,
        visitedElements: /* @__PURE__ */ new Set(),
        inLabelledBy: false,
        inLabel: false,
        depth: 0,
      });
    name = name.replace(/\s+/g, " ").trim().substring(0, 300);
    if (cache) cache.set(element, name);
    return name;
  }
  let _registry = null;
  let _refs = null;
  let _signatureAssigned = null;
  let _refCounter = 0;
  let _visibilityCache = null;
  const OMOWRIGHT_REF_SYMBOL = Symbol("omowright_ref");
  const USER_PASSWORD_REDACTED = "[redacted]";
  function getRefPrefix(ref) {
    return ref.match(/^(f\d+)?e\d+$/)?.[1] ?? "";
  }
  const ROLE_SELECTOR_RE = /^\[role=["'](\w+)["']\]$/;
  function querySelectorWithImplicitRole(selector) {
    const match = selector.match(ROLE_SELECTOR_RE);
    if (!match) return null;
    const targetRole = match[1];
    for (const el of Array.from(document.querySelectorAll("*"))) if (getRole(el) === targetRole) return el;
    return null;
  }
  function getAriaDisabled(element, role) {
    if (!ARIA_DISABLED_ROLES.has(role)) return false;
    if (
      ["button", "input", "select", "textarea", "option", "optgroup"].includes(element.tagName.toLowerCase()) &&
      element.matches(":disabled")
    )
      return true;
    for (let current = element; current; current = getParentElementAcrossShadowBoundary(current))
      if (getAriaBoolean(current.getAttribute("aria-disabled")) === true) return true;
    return false;
  }
  function getAriaChecked(element, role) {
    if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio"))
      return element.checked;
    if (!ARIA_CHECKED_ROLES.has(role)) return false;
    return getAriaBoolean(element.getAttribute("aria-checked")) === true;
  }
  function getAriaSelected(element, role) {
    if (element.tagName.toLowerCase() === "option") return element.selected;
    if (!ARIA_SELECTED_ROLES.has(role)) return false;
    return getAriaBoolean(element.getAttribute("aria-selected")) === true;
  }
  function getTextboxValue(element) {
    if (isContentEditableElement(element)) return element.innerText ?? element.textContent ?? "";
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) return null;
    if (element instanceof HTMLInputElement && ["checkbox", "radio", "file"].includes(element.type)) return null;
    if (element instanceof HTMLInputElement && element.type === "password")
      return element.value ? USER_PASSWORD_REDACTED : "";
    return element.value;
  }
  function getAriaOwnedElements(element) {
    const owns = element.getAttribute("aria-owns");
    if (!owns) return [];
    const ownedElements = [];
    const seen = /* @__PURE__ */ new Set();
    for (const id of owns.split(/\s+/)) {
      if (!id) continue;
      const owned = element.ownerDocument.getElementById(id);
      if (!owned || owned === element || seen.has(owned)) continue;
      seen.add(owned);
      ownedElements.push(owned);
    }
    return ownedElements;
  }
  function normalizeName(name) {
    return name.replace(/\s+/g, " ").trim().substring(0, 100);
  }
  function getLayoutSize(element) {
    const layout = element;
    return {
      width: layout.offsetWidth ?? -1,
      height: layout.offsetHeight ?? -1,
    };
  }
  function getContainingShadowHost(element) {
    const root = typeof element.getRootNode === "function" ? element.getRootNode() : null;
    if (typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot) return root.host;
    return null;
  }
  function getParentElementAcrossShadowBoundary(element) {
    return element.parentElement ?? getContainingShadowHost(element);
  }
  function getLightAndShadowChildNodes(element) {
    const nodes = Array.from(element.childNodes);
    if (element.shadowRoot) nodes.push(...Array.from(element.shadowRoot.childNodes));
    return nodes;
  }
  function hasClippedZeroSizeBox(element, style) {
    const overflowClips =
      style.overflow === "hidden" ||
      style.overflow === "clip" ||
      style.overflowX === "hidden" ||
      style.overflowX === "clip" ||
      style.overflowY === "hidden" ||
      style.overflowY === "clip";
    const { width, height } = getLayoutSize(element);
    return overflowClips && (width === 0 || height === 0);
  }
  /**
   * Checks whether an element is rendered and visible to the user.
   * Merges the ancestor walk for display:contents detection with the main
   * visibility loop to avoid a redundant second traversal.
   */
  function isVisible(element) {
    if (_visibilityCache) {
      const cached = _visibilityCache.get(element);
      if (cached !== void 0) return cached;
    }
    const result = isVisibleUncached(element);
    if (_visibilityCache) _visibilityCache.set(element, result);
    return result;
  }
  function isVisibleUncached(element) {
    if (element.getAttribute("aria-hidden") === "true") return false;
    const targetVisibility = window.getComputedStyle(element).visibility;
    let hasContentsAncestor = false;
    for (
      let current = element;
      current && current !== document.documentElement;
      current = getParentElementAcrossShadowBoundary(current)
    ) {
      const style = window.getComputedStyle(current);
      if (style.display === "contents") {
        hasContentsAncestor = true;
        continue;
      }
      if (style.display === "none") return false;
      if (hasClippedZeroSizeBox(current, style)) return false;
      const { width, height } = getLayoutSize(current);
      if (current.tagName === "IFRAME" && (width === 0 || height === 0)) return false;
      if (style.visibility === "hidden" && targetVisibility !== "visible") return false;
      if (Number.parseFloat(style.opacity) === 0) return false;
    }
    if (typeof element.checkVisibility === "function") {
      if (
        !element.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
        }) &&
        !hasContentsAncestor
      )
        return false;
    }
    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.right <= 0 || rect.bottom <= 0)) {
        const style = window.getComputedStyle(element);
        if (style.overflowX !== "visible" && style.overflowY !== "visible") return false;
      }
    }
    return true;
  }
  function getInteractivitySignals(element) {
    const tag = element.tagName.toLowerCase();
    const role = getExplicitAriaRole(element);
    const tabIndex = element.getAttribute("tabindex");
    const hasTabIndex = tabIndex !== null && tabIndex !== "-1";
    const hasOnClick = element.hasAttribute("onclick");
    const hasCursorPointer = window.getComputedStyle(element).cursor === "pointer";
    const isInteractiveTag = INTERACTIVE_TAGS.has(tag);
    const isRoleInteractive = role === "button" || role === "link";
    const isContentEditable = element.getAttribute("contenteditable") === "true";
    let hasPointerInteraction = hasCursorPointer;
    if (hasCursorPointer && !hasOnClick && !hasTabIndex) {
      const parent = element.parentElement;
      if (parent && window.getComputedStyle(parent).cursor === "pointer") hasPointerInteraction = false;
    }
    const hints = [];
    if (hasPointerInteraction) hints.push("cursor:pointer");
    if (hasOnClick) hints.push("onclick");
    if (hasTabIndex) hints.push("tabindex");
    return {
      interactive:
        isInteractiveTag ||
        hasOnClick ||
        hasTabIndex ||
        isRoleInteractive ||
        isContentEditable ||
        hasPointerInteraction,
      isInteractiveTag,
      hints,
    };
  }
  function isInteractive(element) {
    return getInteractivitySignals(element).interactive;
  }
  const SCROLLABLE_OVERFLOW_VALUES = /* @__PURE__ */ new Set(["auto", "scroll", "overlay"]);
  function isScrollable(element) {
    const tag = element.tagName.toLowerCase();
    if (tag === "html" || tag === "body") return false;
    const style = window.getComputedStyle(element);
    if (!SCROLLABLE_OVERFLOW_VALUES.has(style.overflowX) && !SCROLLABLE_OVERFLOW_VALUES.has(style.overflowY))
      return false;
    return element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1;
  }
  function isLandmark(element) {
    const tag = element.tagName.toLowerCase();
    const explicitRole = getExplicitAriaRole(element);
    return LANDMARK_TAGS.has(tag) || (!!explicitRole && explicitRole !== "presentation" && explicitRole !== "none");
  }
  function shouldTraverse(element, options) {
    const tag = element.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return false;
    if (element.getAttribute("aria-hidden") === "true" && element.children.length === 0) return false;
    if (!options.showHidden && !isVisible(element)) {
      if (tag === "input") {
        const type = element.type;
        if (type === "radio" || type === "checkbox") return true;
      }
      return false;
    }
    return true;
  }
  function shouldIncludeNode(element, options) {
    const role = getRole(element);
    if (options.interactive)
      return (
        role === "canvas" ||
        role === "heading" ||
        isInteractive(element) ||
        isScrollable(element) ||
        isLandmark(element)
      );
    if (isInteractive(element)) return true;
    if (isScrollable(element)) return true;
    if (isLandmark(element)) return true;
    if (getAccessibleName(element).length > 0) return true;
    return role !== "generic" && role !== "image";
  }
  function getOrCreateRefId(element, role, name, refPrefix = "") {
    const writeRefMeta = (ref) => {
      const metaRole = getRole(element);
      const metaName = getAccessibleName(element).substring(0, 100);
      const signature = `${metaRole}::${metaName}`;
      const nth = _signatureAssigned.get(signature) ?? 0;
      _signatureAssigned.set(signature, nth + 1);
      _refs[ref] = {
        role: metaRole,
        name: metaName,
        tagName: element.tagName,
        inputType: element.type || void 0,
        ariaLabel: element.getAttribute("aria-label") || void 0,
        placeholder: element.getAttribute("placeholder") || void 0,
        nthAmongSameSignature: nth,
      };
    };
    const cached = element[OMOWRIGHT_REF_SYMBOL];
    if (cached && cached.role === role && cached.name === name && getRefPrefix(cached.ref) === refPrefix) {
      _registry.set(cached.ref, element);
      writeRefMeta(cached.ref);
      return cached.ref;
    }
    const ref = refPrefix.length > 0 ? `${refPrefix}e${++_refCounter}` : "e" + ++_refCounter;
    element[OMOWRIGHT_REF_SYMBOL] = {
      role,
      name,
      ref,
    };
    _registry.set(ref, element);
    writeRefMeta(ref);
    return ref;
  }
  function findDuplicateRefIds(rootNode) {
    const refCounts = /* @__PURE__ */ new Map();
    const visit = (node) => {
      if (node.refId) refCounts.set(node.refId, (refCounts.get(node.refId) ?? 0) + 1);
      for (const child of node.children) if (typeof child !== "string") visit(child);
    };
    visit(rootNode);
    return [...refCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([refId]) => refId)
      .sort();
  }
  function toSnapshotNode(element, refPrefix = "") {
    const role = getRole(element);
    const roleLower = role.toLowerCase();
    const interactivity = getInteractivitySignals(element);
    const name = normalizeName(getAccessibleName(element));
    const hidden = !isVisible(element);
    const scrollable = isScrollable(element);
    const shouldHaveRef =
      roleLower === "iframe" ||
      roleLower === "canvas" ||
      scrollable ||
      interactivity.interactive ||
      INTERACTIVE_REF_ROLES.has(roleLower) ||
      (CONTENT_REF_ROLES.has(roleLower) && name.length > 0);
    let nodeRefId;
    if (shouldHaveRef) nodeRefId = getOrCreateRefId(element, role, name, refPrefix);
    if (role === "generic" && !nodeRefId && !hidden) return null;
    const hints = [];
    if (interactivity.interactive && !interactivity.isInteractiveTag && interactivity.hints.length > 0)
      hints.push(...interactivity.hints);
    const href = element.getAttribute("href");
    const type = element.getAttribute("type");
    const placeholder = element.getAttribute("placeholder");
    const level = getAriaLevel(element, role);
    const checked = getAriaChecked(element, roleLower);
    const selected = getAriaSelected(element, roleLower);
    const focused = element.ownerDocument.activeElement === element;
    const disabled = getAriaDisabled(element, roleLower);
    const textboxValue = getTextboxValue(element);
    const rect = roleLower === "canvas" ? element.getBoundingClientRect() : null;
    return {
      role,
      name,
      level,
      hidden: hidden || void 0,
      scrollable: scrollable || void 0,
      checked: checked || void 0,
      selected: selected || void 0,
      focused: focused || void 0,
      disabled: disabled || void 0,
      interactiveControl: interactivity.interactive || void 0,
      refId: nodeRefId,
      hints,
      href: href ?? void 0,
      type: type ?? void 0,
      placeholder: placeholder ?? void 0,
      size: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)}` : void 0,
      element,
      children: textboxValue !== null ? [textboxValue] : [],
    };
  }
  /** True when a node carries no semantic payload beyond its role — safe to unwrap or collapse. */
  function isBareWrapper(node) {
    return (
      !node.name &&
      !node.level &&
      !node.hidden &&
      !node.scrollable &&
      !node.checked &&
      !node.selected &&
      !node.focused &&
      !node.disabled &&
      !node.refId &&
      node.hints.length === 0 &&
      !node.href &&
      !node.type &&
      !node.placeholder &&
      !node.size
    );
  }
  function normalizeStringChildren(rootNode) {
    const paragraphLeafToText = (node) => {
      if (node.role !== "paragraph") return null;
      if (!isBareWrapper(node)) return null;
      if (node.children.some((child) => typeof child !== "string")) return null;
      return mergeStringBuffer(node.children) || "";
    };
    const flushChildren = (buffer, normalizedChildren) => {
      if (!buffer.length) return;
      const text = mergeStringBuffer(buffer);
      if (text) normalizedChildren.push(text);
      buffer.length = 0;
    };
    const visit = (node) => {
      const normalizedChildren = [];
      const buffer = [];
      for (const child of node.children) {
        if (typeof child === "string") {
          buffer.push(child);
          continue;
        }
        visit(child);
        const paragraphText = paragraphLeafToText(child);
        if (paragraphText !== null) {
          if (paragraphText) buffer.push(paragraphText);
          continue;
        }
        flushChildren(buffer, normalizedChildren);
        normalizedChildren.push(child);
      }
      flushChildren(buffer, normalizedChildren);
      node.children = normalizedChildren.length ? normalizedChildren : [];
      if (node.children.length === 1 && node.children[0] === node.name) node.children = [];
    };
    visit(rootNode);
  }
  function normalizeGenericRoles(node) {
    const hasRefInSubtree = (children) => {
      for (const child of children) {
        if (typeof child === "string") continue;
        if (child.refId) return true;
        if (hasRefInSubtree(child.children)) return true;
      }
      return false;
    };
    const normalizeChildren = (current) => {
      const result = [];
      for (const child of current.children) {
        if (typeof child === "string") {
          result.push(child);
          continue;
        }
        const normalized = normalizeChildren(child);
        result.push(...normalized);
      }
      if (current.hidden && !current.refId && !hasRefInSubtree(result)) return [];
      const singleChild = result.length === 1 && typeof result[0] !== "string" ? result[0] : null;
      if (current.role === "paragraph" && isBareWrapper(current) && !!singleChild && singleChild.role === "paragraph")
        return singleChild ? [singleChild] : [];
      if (
        current.role === "generic" &&
        !current.hidden &&
        !current.name &&
        result.length <= 1 &&
        result.every((child) => typeof child !== "string" && !!child.refId)
      ) {
        const flattened = [];
        for (const child of result) if (typeof child !== "string") flattened.push(child);
        return flattened;
      }
      current.children = result;
      return [current];
    };
    normalizeChildren(node);
  }
  function withoutWhitespace(text) {
    return normalizeWhitespace(text).replace(/\s+/g, "");
  }
  // `liveText` maps each live-region root to the text pieces the snapshot kept from inside it.
  function mergeTextLeafChildren(node, liveText) {
    const textLeafRoles = /* @__PURE__ */ new Set(["generic", "heading", "paragraph", "label"]);
    const getLeafText = (child) => {
      if (typeof child === "string") return normalizeWhitespace(child) || null;
      if (!textLeafRoles.has(child.role)) return null;
      if (child.hidden) return null;
      if (!child.name || child.children.length > 0) return null;
      return child.name;
    };
    const visit = (current) => {
      for (const child of current.children) if (typeof child !== "string") visit(child);
      if (current.hidden) return;
      if (!current.refId || current.children.length === 0) return;
      if (current.children.length > 3) return;
      const texts = [];
      for (const child of current.children) {
        const text = getLeafText(child);
        if (!text) return;
        texts.push(text);
      }
      const merged = normalizeName(texts.join(" "));
      if (!merged) return;
      if (!current.name) {
        current.name = merged;
        // The name is cut at 100 characters. When the cut drops the text of a live region nested inside
        // this node (a toast in a scrollable or clickable container), that text stays as a child, capped
        // once per live-region root; the container's own text keeps only the cut name.
        const full = texts.join(" ");
        current.children =
          merged.length < normalizeWhitespace(full).length && current.element && !getLiveRegionRoot(current.element)
            ? nestedLiveTexts(current.element, withoutWhitespace(full), withoutWhitespace(merged))
            : [];
        return;
      }
      if (withoutWhitespace(current.name) === withoutWhitespace(merged)) current.children = [];
    };
    // Capped text of the live regions inside `element` that appears in the node's text but not in its cut name.
    const nestedLiveTexts = (element, fullText, nameText) => {
      const kept = [];
      for (const [root, pieces] of liveText) {
        if (root === element || !isSelfOrAncestor(element, root)) continue;
        const text = normalizeName(mergeStringBuffer(pieces));
        const bare = withoutWhitespace(text);
        if (bare && fullText.includes(bare) && !nameText.includes(bare)) kept.push(text);
      }
      return kept;
    };
    visit(node);
  }
  function snapshotNodeToString(node) {
    const parts = [node.role];
    if (node.name) parts.push(`"${escapeSnapshotText(node.name)}"`);
    if (node.refId) parts.push(`[ref=${node.refId}]`);
    if (node.level && node.level > 0) parts.push(`[level=${node.level}]`);
    if (node.hidden) parts.push("[hidden]");
    if (node.scrollable) parts.push("[scrollable]");
    if (node.checked) parts.push("[checked]");
    if (node.disabled) parts.push("[disabled]");
    if (node.focused) parts.push("[focused]");
    if (node.selected) parts.push("[selected]");
    if (node.placeholder) parts.push(`[placeholder="${escapeSnapshotText(node.placeholder)}"]`);
    if (node.size) parts.push(`[size=${node.size}]`);
    return parts.join(" ");
  }
  function renderSnapshotTree(node, depth, lines) {
    const isRoot = node.role === "fragment";
    const childDepth = isRoot ? depth : depth + 1;
    const indent = "  ".repeat(depth);
    const childIndent = "  ".repeat(childDepth);
    if (!isRoot) {
      const nodeString = snapshotNodeToString(node);
      const textChildren = node.children.filter((child) => typeof child === "string");
      const elementChildren = node.children.filter((child) => typeof child !== "string");
      const hasSelectOptions = node.element?.tagName.toLowerCase() === "select";
      if (textChildren.length === 1 && elementChildren.length === 0 && !hasSelectOptions) {
        const text = normalizeWhitespace(textChildren[0] || "");
        if (text) lines.push(`${indent}- ${nodeString}: "${escapeSnapshotText(text)}"`);
        else lines.push(`${indent}- ${nodeString}`);
        return;
      }
      const hasChildren = node.children.length > 0 || hasSelectOptions;
      lines.push(`${indent}- ${nodeString}${hasChildren ? ":" : ""}`);
      if (hasSelectOptions) {
        const selectEl = node.element;
        for (const option of Array.from(selectEl.options)) {
          let optionLine = `${childIndent}- option`;
          const optionText = option.textContent?.trim() || "";
          if (optionText) {
            const truncated = optionText.replace(/\s+/g, " ").substring(0, 100);
            optionLine += ` "${escapeSnapshotText(truncated)}"`;
          }
          if (option.selected) optionLine += " (selected)";
          if (option.value && option.value !== optionText) optionLine += ` value="${escapeSnapshotText(option.value)}"`;
          lines.push(optionLine);
        }
      }
    }
    for (const child of node.children) {
      if (typeof child === "string") {
        const text = normalizeWhitespace(child);
        if (!text) continue;
        lines.push(`${childIndent}- text: "${escapeSnapshotText(text)}"`);
        continue;
      }
      renderSnapshotTree(child, childDepth, lines);
    }
  }
  const defaultOptions = {
    interactive: false,
    maxDepth: 50,
    showHidden: false,
    refPrefix: "",
  };
  /** Generate the YAML-like accessibility tree for the current page or a subtree. */
  function generateAccessibilityTree(elementRegistry, _options = {}) {
    _registry = elementRegistry;
    _refs = {};
    _signatureAssigned = /* @__PURE__ */ new Map();
    _visibilityCache = /* @__PURE__ */ new Map();
    beginAccNameCaches();
    try {
      const options = {
        ...defaultOptions,
        ..._options,
      };
      const maxDepth = options.maxDepth ?? defaultOptions.maxDepth;
      const treeRoot = {
        role: "fragment",
        name: "",
        hints: [],
        children: [],
      };
      const visited = /* @__PURE__ */ new Set();
      // Characters of live-region text an interactive read has kept so far, per live-region root.
      const liveTextLength = /* @__PURE__ */ new Map();
      // Text pieces kept from inside each live-region root, in either mode; see mergeTextLeafChildren.
      const liveText = /* @__PURE__ */ new Map();
      const keepLiveText = (root, text) => {
        if (!liveText.has(root)) liveText.set(root, []);
        liveText.get(root).push(text);
      };
      function traverse(element, currentDepth, parentNode) {
        if (currentDepth > options.maxDepth) return;
        if (!element?.tagName) return;
        if (visited.has(element)) return;
        visited.add(element);
        const traversable = shouldTraverse(element, options);
        const includeAsRoot = !options.refId && element === document.body;
        const hidden = !isVisible(element);
        const include =
          includeAsRoot || (traversable && (shouldIncludeNode(element, options) || (options.showHidden && hidden)));
        if (!traversable && !includeAsRoot) return;
        let currentNode = null;
        let targetNode = parentNode;
        if (include) {
          currentNode = toSnapshotNode(element, options.refPrefix || "");
          if (currentNode) {
            parentNode.children.push(currentNode);
            targetNode = currentNode;
          }
        }
        if (!include && options.interactive && element.childNodes.length === 0) {
          const hoistedName = normalizeName(getAccessibleName(element));
          if (hoistedName && targetNode.role !== "fragment") targetNode.children.push(hoistedName);
        }
        if (currentDepth < maxDepth) {
          const beforeText = getCSSContent(element, "::before");
          if (beforeText) targetNode.children.push(beforeText);
          const nextDepth = include && currentNode ? currentDepth + 1 : currentDepth;
          for (const child of getLightAndShadowChildNodes(element)) {
            if (child.nodeType === Node.TEXT_NODE) {
              if (!child.nodeValue || targetNode.role === "textbox") continue;
              // Interactive reads keep the text of a node that is itself clickable or scrollable, and
              // text inside a live region (live roles or aria-live polite/assertive, such as toasts),
              // capped like an accessible name so a card wrapping a whole article stays short;
              // free-standing prose under landmarks and generics is dropped. A clickable or scrollable
              // node caps its own text; live-region text is capped once per live-region root, whichever
              // kept node it lands on, so two toasts in a row each keep their text and a log of many
              // entries stays bounded. A live region nested inside the clickable or scrollable node (a
              // toast in a scrollable app shell) uses its live-region budget, not the node's own.
              if (options.interactive && targetNode.role !== "heading" && !INTERACTIVE_REF_ROLES.has(targetNode.role)) {
                const liveRoot = getLiveRegionRoot(element);
                const ownText =
                  (targetNode.interactiveControl || targetNode.scrollable) &&
                  !(liveRoot && !isSelfOrAncestor(liveRoot, targetNode.element));
                if (!ownText && !liveRoot) continue;
                const used = ownText ? (targetNode.labelLength ?? 0) : (liveTextLength.get(liveRoot) ?? 0);
                const room = INTERACTIVE_LABEL_MAX - used;
                if (room <= 0) continue;
                const collapsed = child.nodeValue.replace(/\s+/g, " ");
                const kept = used + Math.min(collapsed.length, room);
                if (ownText) targetNode.labelLength = kept;
                else liveTextLength.set(liveRoot, kept);
                const piece = collapsed.length > room ? collapsed.substring(0, room) : child.nodeValue;
                if (liveRoot) keepLiveText(liveRoot, piece);
                targetNode.children.push(piece);
                continue;
              }
              // Text of a wrapper below the kept node may sit in a nested live region; text on the kept
              // node itself never does.
              const liveRoot = element !== targetNode.element && getLiveRegionRoot(element);
              if (liveRoot) keepLiveText(liveRoot, child.nodeValue);
              targetNode.children.push(child.nodeValue);
              continue;
            }
            if (child.nodeType === Node.ELEMENT_NODE) traverse(child, nextDepth, targetNode);
          }
          for (const child of getAriaOwnedElements(element)) traverse(child, nextDepth, targetNode);
          const afterText = getCSSContent(element, "::after");
          if (afterText) targetNode.children.push(afterText);
        }
      }
      if (options.refId) {
        const element = elementRegistry.get(options.refId);
        if (!element || !element.isConnected)
          return {
            error: `Element with ref_id '${options.refId}' not found. It may have been removed from the page. Use read_page without ref_id to get the current page state.`,
            tree: "",
            refs: {},
          };
        traverse(element, 0, treeRoot);
      } else if (options.selector) {
        const element = document.querySelector(options.selector) ?? querySelectorWithImplicitRole(options.selector);
        if (!element)
          return {
            error: `Element matching selector '${options.selector}' not found. It may have been removed from the page. Use read_page without selector to get the current page state.`,
            tree: "",
            refs: {},
          };
        traverse(element, 0, treeRoot);
      } else if (document.body) traverse(document.body, 0, treeRoot);
      normalizeStringChildren(treeRoot);
      normalizeGenericRoles(treeRoot);
      mergeTextLeafChildren(treeRoot, liveText);
      const duplicateRefs = findDuplicateRefIds(treeRoot);
      if (duplicateRefs.length > 0)
        return {
          error: `Snapshot produced duplicate refs: ${duplicateRefs.join(", ")}. Take a new snapshot and retry.`,
          tree: "",
          refs: {},
        };
      const lines = [];
      renderSnapshotTree(treeRoot, 0, lines);
      const tree = lines.join("\n");
      if (options.maxChars && tree.length > options.maxChars) {
        let errorMsg = `Output exceeds ${options.maxChars} character limit (${tree.length} characters). `;
        if (options.refId)
          errorMsg +=
            "The specified element has too much content. Try specifying a smaller depth parameter or focus on a more specific child element.";
        else if (options.maxDepth)
          errorMsg +=
            "Try specifying an even smaller depth parameter or use ref_id to focus on a specific element from the page.";
        else
          errorMsg +=
            "Try specifying a depth parameter (e.g., depth: 5) or use ref_id to focus on a specific element from the page.";
        return {
          error: errorMsg,
          tree: "",
          refs: _refs,
        };
      }
      return {
        tree,
        refs: _refs,
      };
    } finally {
      _registry = null;
      _refs = null;
      _signatureAssigned = null;
      _visibilityCache = null;
      endAccNameCaches();
    }
  }
  (function setupOmOWrightWorld() {
    const elementRegistry = /* @__PURE__ */ new Map();
    let _lastRefs = {};
    function toElement(node) {
      if (node instanceof Element) return node;
      if (node && typeof node === "object" && "parentElement" in node) return node.parentElement;
      return null;
    }
    function takeSnapshot(options) {
      const rootElement = options?.refId ? elementRegistry.get(options.refId) : void 0;
      const previousRegistry = new Map(elementRegistry);
      elementRegistry.clear();
      if (rootElement && options?.refId) elementRegistry.set(options.refId, rootElement);
      try {
        const result = generateAccessibilityTree(elementRegistry, options);
        _lastRefs = result.refs;
        return result;
      } catch {
        elementRegistry.clear();
        for (const [key, value] of previousRegistry) elementRegistry.set(key, value);
        throw new Error("Snapshot failed");
      }
    }
    const DEREF_WALKER_BUDGET = 5e3;
    function deref(ref) {
      const el = elementRegistry.get(ref);
      if (el && el.isConnected) return el;
      const meta = _lastRefs[ref];
      if (!meta) return null;
      const candidates = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let node;
      let visited = 0;
      while ((node = walker.nextNode())) {
        if (++visited > DEREF_WALKER_BUDGET) break;
        if (getRole(node) === meta.role && getAccessibleName(node) === meta.name) candidates.push(node);
      }
      // Recover only a match that was unique in the snapshot and is unique now. Picking
      // the nth of several look-alikes after a re-render can act on a different row.
      const sameInSnapshot = Object.values(_lastRefs).filter(
        (other) => other.role === meta.role && other.name === meta.name,
      ).length;
      if (sameInSnapshot === 1 && candidates.length === 1) return candidates[0] ?? null;
      return null;
    }
    function retarget(element, behavior) {
      let el = toElement(element);
      if (!el) return null;
      if (behavior === "none") return el;
      if (!el.matches("input, textarea, select") && !el.isContentEditable)
        if (behavior === "button-link") el = el.closest("button, [role=button], a, [role=link]") || el;
        else el = el.closest("button, [role=button], [role=checkbox], [role=radio]") || el;
      if (behavior === "follow-label") {
        if (
          !el.matches(
            "a, input, textarea, button, select, [role=link], [role=button], [role=checkbox], [role=radio]",
          ) &&
          !el.isContentEditable
        ) {
          const label = el.closest("label");
          if (label?.control) el = label.control;
        }
      }
      return el;
    }
    function resolvePointerTarget(element) {
      const el = toElement(element);
      if (!el) return null;
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        const visibleLabel = Array.from(el.labels ?? []).find((label) => {
          const style = label.ownerDocument?.defaultView?.getComputedStyle?.(label);
          if (style && (style.display === "none" || style.visibility === "hidden")) return false;
          const rect = label.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (visibleLabel) return visibleLabel;
      }
      const nativeFormTargetSelector = 'input:not([type="hidden"]), select, textarea';
      const nestedFormTargetSelector = [
        nativeFormTargetSelector,
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="switch"]',
      ].join(", ");
      const formControlHostSelector = [
        "label",
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="switch"]',
        "mat-checkbox",
        "mat-radio-button",
        "mat-slide-toggle",
      ].join(", ");
      const label = el.closest("label");
      if (label?.control) {
        const labelStyle = label.ownerDocument?.defaultView?.getComputedStyle?.(label);
        const labelRect = label.getBoundingClientRect();
        const controlRect = label.control.getBoundingClientRect();
        if (
          (!labelStyle || (labelStyle.display !== "none" && labelStyle.visibility !== "hidden")) &&
          labelRect.width > 0 &&
          labelRect.height > 0 &&
          (controlRect.width === 0 || controlRect.height === 0)
        )
          return label;
        return label.control;
      }
      const formHost = el.closest(formControlHostSelector);
      const nestedFormTarget = formHost?.querySelector(nestedFormTargetSelector);
      if (nestedFormTarget && nestedFormTarget !== formHost) return nestedFormTarget;
      if (el.hasAttribute("aria-checked") || el.hasAttribute("aria-selected")) return el;
      if (!el.matches("li, [role=listitem], [role=menuitem], [role=option]")) return el;
      const selector = [
        nativeFormTargetSelector,
        "button",
        "a[href]",
        "summary",
        '[role="button"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="switch"]',
        "[aria-checked]",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");
      const candidates = Array.from(el.querySelectorAll(selector)).filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (candidates.length === 0) return el;
      return (
        candidates.find((candidate) =>
          candidate.matches(
            'input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"], [role="switch"], [aria-checked]',
          ),
        ) ??
        candidates.find((candidate) => candidate.tabIndex >= 0) ??
        candidates[0] ??
        el
      );
    }
    function checkHitTarget(element, point) {
      const el = toElement(element);
      if (!el)
        return {
          ok: false,
          error: "Node is not an Element",
        };
      const isComposedDescendant = (candidate, ancestor) => {
        let current = candidate;
        while (current) {
          if (current === ancestor) return true;
          if (current instanceof ShadowRoot) {
            current = current.host;
            continue;
          }
          current = current.parentNode;
        }
        return false;
      };
      let root = el.ownerDocument;
      let hitElement = null;
      while (root) {
        const candidate = root.elementFromPoint(point.x, point.y);
        if (!candidate) break;
        hitElement = candidate;
        if (isComposedDescendant(candidate, el)) return { ok: true };
        root = candidate.shadowRoot;
      }
      if (!hitElement) {
        const rect = el.getBoundingClientRect();
        if (el.isConnected && rect.width > 0 && rect.height > 0) return { ok: true };
        return {
          ok: false,
          error: "Element is obscured at click point",
        };
      }
      if (isComposedDescendant(el, hitElement)) return { ok: true };
      return {
        ok: false,
        error: "Element is obscured by another element",
      };
    }
    async function waitForReady(element, checks, timeoutMs = 5e3) {
      const el = toElement(element);
      if (!el)
        return {
          ok: false,
          error: "Node is not an Element (text node or non-Element handle)",
        };
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (checks.includes("attached") && !el.isConnected)
          return {
            ok: false,
            error: "Element is detached from the DOM",
          };
        if (checks.includes("visible")) {
          const rect = el.getBoundingClientRect();
          if (
            !(
              el.checkVisibility?.({
                checkOpacity: false,
                checkVisibilityCSS: true,
              }) !== false &&
              rect.width > 0 &&
              rect.height > 0
            )
          ) {
            await new Promise((r) => setTimeout(r, 16));
            continue;
          }
        }
        if (checks.includes("enabled") && isDisabled(el))
          return {
            ok: false,
            error: "Element is disabled",
          };
        if (checks.includes("stable")) {
          const prev = el.getBoundingClientRect();
          await new Promise((r) => setTimeout(r, 32));
          const curr = el.getBoundingClientRect();
          if (prev.x !== curr.x || prev.y !== curr.y || prev.width !== curr.width || prev.height !== curr.height) {
            if (Date.now() - start + 32 >= timeoutMs)
              return {
                ok: false,
                error: "Element is moving",
              };
            continue;
          }
        }
        return { ok: true };
      }
      return {
        ok: false,
        error: "Timeout waiting for element to be ready",
      };
    }
    function checkEditable(element) {
      if (isDisabled(element))
        return {
          ok: false,
          error: "Element is disabled",
        };
      const tag = element.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag))
        return element.hasAttribute("readonly")
          ? {
              ok: false,
              error: "Element is read-only",
            }
          : { ok: true };
      if (element.getAttribute("contenteditable") === "false")
        return {
          ok: false,
          error: "Element is not editable",
        };
      if (ARIA_READONLY_ROLES.has(getRole(element)))
        return element.getAttribute("aria-readonly") === "true"
          ? {
              ok: false,
              error: "Element is read-only (aria-readonly)",
            }
          : { ok: true };
      if (element.isContentEditable) return { ok: true };
      return {
        ok: false,
        error: "Element does not support editable state",
      };
    }
    function isDisabled(element) {
      if (["BUTTON", "INPUT", "SELECT", "TEXTAREA", "OPTION", "OPTGROUP"].includes(element.tagName)) {
        if (element.disabled) return true;
        const fieldset = element.closest("fieldset:disabled");
        if (fieldset) {
          const legend = fieldset.querySelector(":scope > legend");
          if (!legend || !legend.contains(element)) return true;
        }
      }
      let el = element;
      while (el) {
        if (el.getAttribute("aria-disabled") === "true") return true;
        el = el.parentElement;
      }
      return false;
    }
    globalThis.__omowright = {
      elementRegistry,
      snapshotEpoch: 0,
      takeSnapshot,
      deref,
      retarget,
      resolvePointerTarget,
      waitForReady,
      checkHitTarget,
      checkEditable,
    };
  })();
})();
