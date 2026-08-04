import {
  Tooltip,
  TooltipModule
} from "./chunk-ARE2VO3L.js";
import "./chunk-GJCZ6W4C.js";
import "./chunk-5G7WYC4N.js";
import {
  Ripple
} from "./chunk-DKWWSLFP.js";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TimesIcon
} from "./chunk-HNSMNGRF.js";
import {
  BaseComponent
} from "./chunk-PIUQLW6G.js";
import {
  BaseStyle
} from "./chunk-ALH7HT4Z.js";
import {
  PrimeTemplate,
  SharedModule
} from "./chunk-54BX65E2.js";
import {
  find,
  findSingle,
  focus,
  getAttribute,
  getOffset,
  getOuterWidth,
  getWidth,
  uuid
} from "./chunk-QKBOSGYF.js";
import "./chunk-CWYBPNCF.js";
import "./chunk-NJ25EVEJ.js";
import {
  CommonModule,
  NgClass,
  NgIf,
  NgStyle,
  NgTemplateOutlet
} from "./chunk-2TPVRS5D.js";
import {
  isPlatformBrowser
} from "./chunk-2O5SWWEU.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  HostBinding,
  Injectable,
  Input,
  NgModule,
  Output,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  inject,
  numberAttribute,
  setClassMetadata,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-XWXRX5GW.js";
import "./chunk-IC62NIWK.js";
import "./chunk-ISM5WLAM.js";
import "./chunk-ZZ67MR3E.js";
import "./chunk-QHQP2P2Z.js";

// node_modules/primeng/fesm2022/primeng-tabview.mjs
var _c0 = ["content"];
var _c1 = ["header"];
var _c2 = ["lefticon"];
var _c3 = ["righticon"];
var _c4 = ["closeicon"];
var _c5 = ["*"];
function TabPanel_div_0_ng_container_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function TabPanel_div_0_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, TabPanel_div_0_ng_container_2_ng_container_1_Template, 1, 0, "ng-container", 3);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r0.contentTemplate || ctx_r0._contentTemplate);
  }
}
function TabPanel_div_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 1);
    ɵɵprojection(1);
    ɵɵtemplate(2, TabPanel_div_0_ng_container_2_Template, 2, 1, "ng-container", 2);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵproperty("hidden", !ctx_r0.selected);
    ɵɵattribute("id", ctx_r0.tabView.getTabContentId(ctx_r0.id))("aria-hidden", !ctx_r0.selected)("aria-labelledby", ctx_r0.tabView.getTabHeaderActionId(ctx_r0.id))("data-pc-name", "tabpanel");
    ɵɵadvance(2);
    ɵɵproperty("ngIf", (ctx_r0.contentTemplate || ctx_r0._contentTemplate) && (ctx_r0.cache ? ctx_r0.loaded : ctx_r0.selected));
  }
}
var _c6 = ["previousicon"];
var _c7 = ["nexticon"];
var _c8 = ["navbar"];
var _c9 = ["prevBtn"];
var _c10 = ["nextBtn"];
var _c11 = ["inkbar"];
var _c12 = ["elementToObserve"];
var _c13 = (a0) => ({
  "p-tablist-viewport": a0
});
var _c14 = (a0, a1) => ({
  "p-tab": true,
  "p-tab-active": a0,
  "p-disabled": a1
});
function TabView_button_2_ChevronLeftIcon_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronLeftIcon");
  }
  if (rf & 2) {
    ɵɵattribute("aria-hidden", true);
  }
}
function TabView_button_2_3_ng_template_0_Template(rf, ctx) {
}
function TabView_button_2_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_button_2_3_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TabView_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 12, 3);
    ɵɵlistener("click", function TabView_button_2_Template_button_click_0_listener() {
      ɵɵrestoreView(_r2);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.navBackward());
    });
    ɵɵtemplate(2, TabView_button_2_ChevronLeftIcon_2_Template, 1, 1, "ChevronLeftIcon", 13)(3, TabView_button_2_3_Template, 1, 0, null, 14);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵattribute("tabindex", ctx_r2.tabindex)("aria-label", ctx_r2.prevButtonAriaLabel);
    ɵɵadvance(2);
    ɵɵproperty("ngIf", !ctx_r2.previousIconTemplate && !ctx_r2._previousIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r2.previousIconTemplate && ctx_r2._previousIconTemplate);
  }
}
function TabView_For_8_Conditional_0_Conditional_1_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function TabView_For_8_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_1_ng_container_0_Template, 1, 0, "ng-container", 14);
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(2).$implicit;
    ɵɵproperty("ngTemplateOutlet", tab_r5.headerTemplate || tab_r5._headerTemplate);
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_0_0_ng_template_0_Template(rf, ctx) {
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_0_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_0_0_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_0_0_Template, 1, 0, null, 14);
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(3).$implicit;
    ɵɵproperty("ngTemplateOutlet", tab_r5.leftIconTemplate || tab_r5._leftIconTemplate);
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 17);
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(3).$implicit;
    ɵɵproperty("ngClass", tab_r5.leftIcon);
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_3_0_ng_template_0_Template(rf, ctx) {
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_3_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_3_0_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_3_0_Template, 1, 0, null, 14);
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(3).$implicit;
    ɵɵproperty("ngTemplateOutlet", tab_r5.rightIconTemplate || tab_r5._rightIconTemplate);
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 18);
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(3).$implicit;
    ɵɵproperty("ngClass", tab_r5.rightIcon);
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_0_0_ng_template_0_Template(rf, ctx) {
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_0_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_0_0_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_0_0_Template, 1, 0, null, 14);
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(4).$implicit;
    ɵɵproperty("ngTemplateOutlet", tab_r5.closeIconTemplate || tab_r5._closeIconTemplate);
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "TimesIcon", 19);
    ɵɵlistener("click", function TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_1_Template_TimesIcon_click_0_listener($event) {
      ɵɵrestoreView(_r6);
      const tab_r5 = ɵɵnextContext(4).$implicit;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.close($event, tab_r5));
    });
    ɵɵelementEnd();
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_0_Template, 1, 1)(1, TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Conditional_1_Template, 1, 0, "TimesIcon");
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(3).$implicit;
    ɵɵconditional(tab_r5.closeIconTemplate || tab_r5._closeIconTemplate ? 0 : 1);
  }
}
function TabView_For_8_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Conditional_2_Conditional_0_Template, 1, 1)(1, TabView_For_8_Conditional_0_Conditional_2_Conditional_1_Template, 1, 1, "span", 17);
    ɵɵtext(2);
    ɵɵtemplate(3, TabView_For_8_Conditional_0_Conditional_2_Conditional_3_Template, 1, 1)(4, TabView_For_8_Conditional_0_Conditional_2_Conditional_4_Template, 1, 1, "span", 18)(5, TabView_For_8_Conditional_0_Conditional_2_Conditional_5_Template, 2, 1);
  }
  if (rf & 2) {
    const tab_r5 = ɵɵnextContext(2).$implicit;
    ɵɵconditional(tab_r5.leftIconTemplate || tab_r5._leftIconTemplate ? 0 : tab_r5.leftIcon && !tab_r5.leftIconTemplate && !tab_r5._leftIconTemplate ? 1 : -1);
    ɵɵadvance(2);
    ɵɵtextInterpolate1(" ", tab_r5.header, " ");
    ɵɵadvance();
    ɵɵconditional(tab_r5.rightIconTemplate || tab_r5._rightIconTemplate ? 3 : tab_r5.rightIcon && !tab_r5.rightIconTemplate && !tab_r5._rightIconTemplate ? 4 : -1);
    ɵɵadvance(2);
    ɵɵconditional(tab_r5.closable ? 5 : -1);
  }
}
function TabView_For_8_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 15);
    ɵɵlistener("click", function TabView_For_8_Conditional_0_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r4);
      const tab_r5 = ɵɵnextContext().$implicit;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.open($event, tab_r5));
    })("keydown", function TabView_For_8_Conditional_0_Template_button_keydown_0_listener($event) {
      ɵɵrestoreView(_r4);
      const tab_r5 = ɵɵnextContext().$implicit;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onTabKeyDown($event, tab_r5));
    });
    ɵɵtemplate(1, TabView_For_8_Conditional_0_Conditional_1_Template, 1, 1, "ng-container")(2, TabView_For_8_Conditional_0_Conditional_2_Template, 6, 4);
    ɵɵelementEnd();
    ɵɵelement(3, "span", 16, 4);
  }
  if (rf & 2) {
    const ctx_r6 = ɵɵnextContext();
    const tab_r5 = ctx_r6.$implicit;
    const ɵ$index_19_r8 = ctx_r6.$index;
    const ctx_r2 = ɵɵnextContext();
    ɵɵclassMap(tab_r5.headerStyleClass);
    ɵɵproperty("ngClass", ɵɵpureFunction2(22, _c14, tab_r5.selected, tab_r5.disabled))("ngStyle", tab_r5.headerStyle)("pTooltip", tab_r5.tooltip)("tooltipPosition", tab_r5.tooltipPosition)("positionStyle", tab_r5.tooltipPositionStyle)("tooltipStyleClass", tab_r5.tooltipStyleClass)("disabled", tab_r5.disabled);
    ɵɵattribute("role", "tab")("id", ctx_r2.getTabHeaderActionId(tab_r5.id))("aria-controls", ctx_r2.getTabContentId(tab_r5.id))("aria-selected", tab_r5.selected)("tabindex", tab_r5.disabled || !tab_r5.selected ? "-1" : ctx_r2.tabindex)("aria-disabled", tab_r5.disabled)("data-pc-index", ɵ$index_19_r8)("data-p-disabled", tab_r5.disabled)("data-pc-section", "headeraction")("data-p-active", tab_r5.selected);
    ɵɵadvance();
    ɵɵconditional(tab_r5.headerTemplate || tab_r5._headerTemplate ? 1 : 2);
    ɵɵadvance(2);
    ɵɵattribute("aria-hidden", true)("data-pc-section", "inkbar");
  }
}
function TabView_For_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_For_8_Conditional_0_Template, 5, 25);
  }
  if (rf & 2) {
    const tab_r5 = ctx.$implicit;
    ɵɵconditional(!tab_r5.closed ? 0 : -1);
  }
}
function TabView_button_9_Conditional_2_0_ng_template_0_Template(rf, ctx) {
}
function TabView_button_9_Conditional_2_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_button_9_Conditional_2_0_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TabView_button_9_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabView_button_9_Conditional_2_0_Template, 1, 0, null, 14);
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext(2);
    ɵɵproperty("ngTemplateOutlet", ctx_r2.nextIconTemplate || ctx_r2._nextIconTemplate);
  }
}
function TabView_button_9_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronRightIcon");
  }
  if (rf & 2) {
    ɵɵattribute("aria-hidden", true);
  }
}
function TabView_button_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 20, 5);
    ɵɵlistener("click", function TabView_button_9_Template_button_click_0_listener() {
      ɵɵrestoreView(_r9);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.navForward());
    });
    ɵɵtemplate(2, TabView_button_9_Conditional_2_Template, 1, 1)(3, TabView_button_9_Conditional_3_Template, 1, 1, "ChevronRightIcon");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵattribute("tabindex", ctx_r2.tabindex)("aria-label", ctx_r2.nextButtonAriaLabel);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r2.nextIconTemplate || ctx_r2._nextIconTemplate ? 2 : 3);
  }
}
var theme = ({
  dt
}) => `
.p-tabs {
    display: flex;
    flex-direction: column;
}

.p-tablist {
    display: flex;
    position: relative;
}

.p-tabs-scrollable > .p-tablist {
    overflow: hidden;
}

.p-tablist-viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    overscroll-behavior: contain auto;
}

.p-tablist-viewport::-webkit-scrollbar {
    display: none;
}

.p-tablist-tab-list {
    position: relative;
    display: flex;
    background: ${dt("tabs.tablist.background")};
    border-style: solid;
    border-color: ${dt("tabs.tablist.border.color")};
    border-width: ${dt("tabs.tablist.border.width")};
}

.p-tablist-content {
    flex-grow: 1;
}

.p-tablist-nav-button {
    all: unset;
    position: absolute !important;
    flex-shrink: 0;
    top: 0;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${dt("tabs.nav.button.background")};
    color: ${dt("tabs.nav.button.color")};
    width: ${dt("tabs.nav.button.width")};
    transition: color ${dt("tabs.transition.duration")}, outline-color ${dt("tabs.transition.duration")}, box-shadow ${dt("tabs.transition.duration")};
    box-shadow: ${dt("tabs.nav.button.shadow")};
    outline-color: transparent;
    cursor: pointer;
}

.p-tablist-nav-button:focus-visible {
    z-index: 1;
    box-shadow: ${dt("tabs.nav.button.focus.ring.shadow")};
    outline: ${dt("tabs.nav.button.focus.ring.width")} ${dt("tabs.nav.button.focus.ring.style")} ${dt("tabs.nav.button.focus.ring.color")};
    outline-offset: ${dt("tabs.nav.button.focus.ring.offset")};
}

.p-tablist-nav-button:hover {
    color: ${dt("tabs.nav.button.hover.color")};
}

.p-tablist-prev-button {
    left: 0;
}

.p-tablist-next-button {
    right: 0;
}

.p-tab {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
    position: relative;
    border-style: solid;
    white-space: nowrap;
    gap: ${dt("tabs.tab.gap")};
    background: ${dt("tabs.tab.background")};
    border-width: ${dt("tabs.tab.border.width")};
    border-color: ${dt("tabs.tab.border.color")};
    color: ${dt("tabs.tab.color")};
    padding: ${dt("tabs.tab.padding")};
    font-weight: ${dt("tabs.tab.font.weight")};
    transition: background ${dt("tabs.transition.duration")}, border-color ${dt("tabs.transition.duration")}, color ${dt("tabs.transition.duration")}, outline-color ${dt("tabs.transition.duration")}, box-shadow ${dt("tabs.transition.duration")};
    margin: ${dt("tabs.tab.margin")};
    outline-color: transparent;
}

.p-tab:not(.p-disabled):focus-visible {
    z-index: 1;
    box-shadow: ${dt("tabs.tab.focus.ring.shadow")};
    outline: ${dt("tabs.tab.focus.ring.width")} ${dt("tabs.tab.focus.ring.style")} ${dt("tabs.tab.focus.ring.color")};
    outline-offset: ${dt("tabs.tab.focus.ring.offset")};
}

.p-tab:not(.p-tab-active):not(.p-disabled):hover {
    background: ${dt("tabs.tab.hover.background")};
    border-color: ${dt("tabs.tab.hover.border.color")};
    color: ${dt("tabs.tab.hover.color")};
}

.p-tab-active {
    background: ${dt("tabs.tab.active.background")};
    border-color: ${dt("tabs.tab.active.border.color")};
    color: ${dt("tabs.tab.active.color")};
}

.p-tabpanels {
    background: ${dt("tabs.tabpanel.background")};
    color: ${dt("tabs.tabpanel.color")};
    padding: ${dt("tabs.tabpanel.padding")};
    outline: 0 none;
}

.p-tabpanel:focus-visible {
    box-shadow: ${dt("tabs.tabpanel.focus.ring.shadow")};
    outline: ${dt("tabs.tabpanel.focus.ring.width")} ${dt("tabs.tabpanel.focus.ring.style")} ${dt("tabs.tabpanel.focus.ring.color")};
    outline-offset: ${dt("tabs.tabpanel.focus.ring.offset")};
}

.p-tablist-active-bar {
    z-index: 1;
    display: block;
    position: absolute;
    bottom: ${dt("tabs.active.bar.bottom")};
    height: ${dt("tabs.active.bar.height")};
    background: ${dt("tabs.active.bar.background")};
    transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
}
`;
var classes = {
  root: ({
    props
  }) => ["p-tabs p-component", {
    "p-tabs-scrollable": props.scrollable
  }]
};
var TabsStyle = class _TabsStyle extends BaseStyle {
  name = "tabs";
  theme = theme;
  classes = classes;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵTabsStyle_BaseFactory;
    return function TabsStyle_Factory(__ngFactoryType__) {
      return (ɵTabsStyle_BaseFactory || (ɵTabsStyle_BaseFactory = ɵɵgetInheritedFactory(_TabsStyle)))(__ngFactoryType__ || _TabsStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _TabsStyle,
    factory: _TabsStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TabsStyle, [{
    type: Injectable
  }], null, null);
})();
var TabsClasses;
(function(TabsClasses2) {
  TabsClasses2["root"] = "p-tabs";
  TabsClasses2["list"] = "p-tablist";
  TabsClasses2["content"] = "p-tablist-content";
  TabsClasses2["tablist"] = "p-tablist-tab-list";
  TabsClasses2["tab"] = "p-tab";
  TabsClasses2["inkbar"] = "p-tablist-active-bar";
  TabsClasses2["button"] = "p-tablist-nav-button";
  TabsClasses2["tabpanels"] = "p-tabpanels";
  TabsClasses2["tabpanel"] = "p-tabs-panel";
})(TabsClasses || (TabsClasses = {}));
var TabPanel = class _TabPanel extends BaseComponent {
  /**
   * Defines if tab can be removed.
   * @group Props
   */
  closable = false;
  /**
   * Inline style of the tab header.
   * @group Props
   */
  get headerStyle() {
    return this._headerStyle;
  }
  set headerStyle(headerStyle) {
    this._headerStyle = headerStyle;
    this.tabView.cd.markForCheck();
  }
  /**
   * Style class of the tab header.
   * @group Props
   */
  get headerStyleClass() {
    return this._headerStyleClass;
  }
  set headerStyleClass(headerStyleClass) {
    this._headerStyleClass = headerStyleClass;
    this.tabView.cd.markForCheck();
  }
  /**
   * Whether a lazy loaded panel should avoid getting loaded again on reselection.
   * @group Props
   */
  cache = true;
  /**
   * Advisory information to display in a tooltip on hover.
   * @group Props
   */
  tooltip;
  /**
   * Position of the tooltip.
   * @group Props
   */
  tooltipPosition = "top";
  /**
   * Type of CSS position.
   * @group Props
   */
  tooltipPositionStyle = "absolute";
  /**
   * Style class of the tooltip.
   * @group Props
   */
  tooltipStyleClass;
  /**
   * Defines if tab is active.
   * @defaultValue false
   * @group Props
   */
  get selected() {
    return !!this._selected;
  }
  set selected(val) {
    this._selected = val;
    if (!this.loaded) {
      this.cd.detectChanges();
    }
    if (val) this.loaded = true;
  }
  /**
   * When true, tab cannot be activated.
   * @defaultValue false
   * @group Props
   */
  get disabled() {
    return !!this._disabled;
  }
  set disabled(disabled) {
    this._disabled = disabled;
    this.tabView.cd.markForCheck();
  }
  /**
   * Title of the tabPanel.
   * @group Props
   */
  get header() {
    return this._header;
  }
  set header(header) {
    this._header = header;
    Promise.resolve().then(() => {
      this.tabView.updateInkBar();
      this.tabView.cd.markForCheck();
    });
  }
  /**
   * Left icon of the tabPanel.
   * @group Props
   * @deprecated since v15.4.2, use `lefticon` template instead.
   */
  get leftIcon() {
    return this._leftIcon;
  }
  set leftIcon(leftIcon) {
    this._leftIcon = leftIcon;
    this.tabView.cd.markForCheck();
  }
  /**
   * Left icon of the tabPanel.
   * @group Props
   * @deprecated since v15.4.2, use `righticon` template instead.
   */
  get rightIcon() {
    return this._rightIcon;
  }
  set rightIcon(rightIcon) {
    this._rightIcon = rightIcon;
    this.tabView.cd.markForCheck();
  }
  closed = false;
  _headerStyle;
  _headerStyleClass;
  _selected;
  _disabled;
  _header;
  _leftIcon;
  _rightIcon = void 0;
  loaded = false;
  id = uuid("pn_id_");
  contentTemplate;
  headerTemplate;
  leftIconTemplate;
  rightIconTemplate;
  closeIconTemplate;
  templates;
  tabView = inject(forwardRef(() => TabView));
  _componentStyle = inject(TabsStyle);
  _headerTemplate;
  _contentTemplate;
  _rightIconTemplate;
  _leftIconTemplate;
  _closeIconTemplate;
  ngAfterContentInit() {
    this.templates.forEach((item) => {
      switch (item.getType()) {
        case "header":
          this._headerTemplate = item.template;
          break;
        case "content":
          this._contentTemplate = item.template;
          break;
        case "righticon":
          this._rightIconTemplate = item.template;
          break;
        case "lefticon":
          this._leftIconTemplate = item.template;
          break;
        case "closeicon":
          this._closeIconTemplate = item.template;
          break;
        default:
          this._contentTemplate = item.template;
          break;
      }
    });
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵTabPanel_BaseFactory;
    return function TabPanel_Factory(__ngFactoryType__) {
      return (ɵTabPanel_BaseFactory || (ɵTabPanel_BaseFactory = ɵɵgetInheritedFactory(_TabPanel)))(__ngFactoryType__ || _TabPanel);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _TabPanel,
    selectors: [["p-tabPanel"], ["p-tabpanel"]],
    contentQueries: function TabPanel_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _c0, 5);
        ɵɵcontentQuery(dirIndex, _c1, 5);
        ɵɵcontentQuery(dirIndex, _c2, 5);
        ɵɵcontentQuery(dirIndex, _c3, 5);
        ɵɵcontentQuery(dirIndex, _c4, 5);
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.contentTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.headerTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.leftIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.rightIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.closeIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    inputs: {
      closable: [2, "closable", "closable", booleanAttribute],
      headerStyle: "headerStyle",
      headerStyleClass: "headerStyleClass",
      cache: [2, "cache", "cache", booleanAttribute],
      tooltip: "tooltip",
      tooltipPosition: "tooltipPosition",
      tooltipPositionStyle: "tooltipPositionStyle",
      tooltipStyleClass: "tooltipStyleClass",
      selected: "selected",
      disabled: "disabled",
      header: "header",
      leftIcon: "leftIcon",
      rightIcon: "rightIcon"
    },
    features: [ɵɵProvidersFeature([TabsStyle]), ɵɵInheritDefinitionFeature],
    ngContentSelectors: _c5,
    decls: 1,
    vars: 1,
    consts: [["class", "p-tabview-panel", "role", "tabpanel", 3, "hidden", 4, "ngIf"], ["role", "tabpanel", 1, "p-tabview-panel", 3, "hidden"], [4, "ngIf"], [4, "ngTemplateOutlet"]],
    template: function TabPanel_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵtemplate(0, TabPanel_div_0_Template, 3, 6, "div", 0);
      }
      if (rf & 2) {
        ɵɵproperty("ngIf", !ctx.closed);
      }
    },
    dependencies: [CommonModule, NgIf, NgTemplateOutlet, SharedModule],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TabPanel, [{
    type: Component,
    args: [{
      selector: "p-tabPanel, p-tabpanel",
      standalone: true,
      imports: [CommonModule, SharedModule],
      template: `
        <div
            *ngIf="!closed"
            class="p-tabview-panel"
            role="tabpanel"
            [hidden]="!selected"
            [attr.id]="tabView.getTabContentId(id)"
            [attr.aria-hidden]="!selected"
            [attr.aria-labelledby]="tabView.getTabHeaderActionId(id)"
            [attr.data-pc-name]="'tabpanel'"
        >
            <ng-content></ng-content>
            <ng-container *ngIf="(contentTemplate || _contentTemplate) && (cache ? loaded : selected)">
                <ng-container *ngTemplateOutlet="contentTemplate || _contentTemplate"></ng-container>
            </ng-container>
        </div>
    `,
      providers: [TabsStyle]
    }]
  }], null, {
    closable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    headerStyle: [{
      type: Input
    }],
    headerStyleClass: [{
      type: Input
    }],
    cache: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    tooltip: [{
      type: Input
    }],
    tooltipPosition: [{
      type: Input
    }],
    tooltipPositionStyle: [{
      type: Input
    }],
    tooltipStyleClass: [{
      type: Input
    }],
    selected: [{
      type: Input
    }],
    disabled: [{
      type: Input
    }],
    header: [{
      type: Input
    }],
    leftIcon: [{
      type: Input
    }],
    rightIcon: [{
      type: Input
    }],
    contentTemplate: [{
      type: ContentChild,
      args: ["content"]
    }],
    headerTemplate: [{
      type: ContentChild,
      args: ["header"]
    }],
    leftIconTemplate: [{
      type: ContentChild,
      args: ["lefticon"]
    }],
    rightIconTemplate: [{
      type: ContentChild,
      args: ["righticon"]
    }],
    closeIconTemplate: [{
      type: ContentChild,
      args: ["closeicon"]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var TabView = class _TabView extends BaseComponent {
  get hostClass() {
    return this.styleClass;
  }
  get hostStyle() {
    return this.style;
  }
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Style class of the component.
   * @group Props
   */
  styleClass;
  /**
   * Whether tab close is controlled at onClose event or not.
   * @defaultValue false
   * @group Props
   */
  controlClose;
  /**
   * When enabled displays buttons at each side of the tab headers to scroll the tab list.
   * @defaultValue false
   * @group Props
   */
  scrollable;
  /**
   * Index of the active tab to change selected tab programmatically.
   * @group Props
   */
  get activeIndex() {
    return this._activeIndex;
  }
  set activeIndex(val) {
    this._activeIndex = val;
    if (this.preventActiveIndexPropagation) {
      this.preventActiveIndexPropagation = false;
      return;
    }
    if (this.tabs && this.tabs.length && this._activeIndex != null && this.tabs.length > this._activeIndex) {
      this.findSelectedTab().selected = false;
      this.tabs[this._activeIndex].selected = true;
      this.tabChanged = true;
      this.updateScrollBar(val);
    }
  }
  /**
   * When enabled, the focused tab is activated.
   * @group Props
   */
  selectOnFocus = false;
  /**
   * Used to define a string aria label attribute the forward navigation button.
   * @group Props
   */
  nextButtonAriaLabel;
  /**
   * Used to define a string aria label attribute the backward navigation button.
   * @group Props
   */
  prevButtonAriaLabel;
  /**
   * When activated, navigation buttons will automatically hide or show based on the available space within the container.
   * @group Props
   */
  autoHideButtons = true;
  /**
   * Index of the element in tabbing order.
   * @group Props
   */
  tabindex = 0;
  /**
   * Callback to invoke on tab change.
   * @param {TabViewChangeEvent} event - Custom tab change event
   * @group Emits
   */
  onChange = new EventEmitter();
  /**
   * Callback to invoke on tab close.
   * @param {TabViewCloseEvent} event - Custom tab close event
   * @group Emits
   */
  onClose = new EventEmitter();
  /**
   * Callback to invoke on the active tab change.
   * @param {number} index - New active index
   * @group Emits
   */
  activeIndexChange = new EventEmitter();
  content;
  navbar;
  prevBtn;
  nextBtn;
  inkbar;
  tabPanels;
  initialized;
  tabs;
  _activeIndex;
  preventActiveIndexPropagation;
  tabChanged;
  backwardIsDisabled = true;
  forwardIsDisabled = false;
  tabChangesSubscription;
  resizeObserver;
  container;
  list;
  buttonVisible;
  elementToObserve;
  previousIconTemplate;
  nextIconTemplate;
  _previousIconTemplate;
  _nextIconTemplate;
  _componentStyle = inject(TabsStyle);
  templates;
  ngOnInit() {
    super.ngOnInit();
    console.log("TabView component is deprecated as of v18. Use Tabs component instead.");
  }
  ngAfterContentInit() {
    this.initTabs();
    this.tabChangesSubscription = this.tabPanels.changes.subscribe((_) => {
      this.initTabs();
      this.refreshButtonState();
    });
    this.templates.forEach((item) => {
      switch (item.getType()) {
        case "previousicon":
          this._previousIconTemplate = item.template;
          break;
        case "nexticon":
          this._nextIconTemplate = item.template;
          break;
      }
    });
  }
  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (isPlatformBrowser(this.platformId)) {
      if (this.autoHideButtons) {
        this.bindResizeObserver();
      }
    }
  }
  bindResizeObserver() {
    this.container = findSingle(this.el.nativeElement, '[data-pc-section="navcontent"]');
    this.list = findSingle(this.el.nativeElement, '[data-pc-section="nav"]');
    this.resizeObserver = new ResizeObserver(() => {
      if (this.list.offsetWidth >= this.container.offsetWidth) {
        this.buttonVisible = true;
      } else {
        this.buttonVisible = false;
      }
      this.updateButtonState();
      this.cd.detectChanges();
    });
    this.resizeObserver.observe(this.container);
  }
  unbindResizeObserver() {
    this.resizeObserver.unobserve(this.elementToObserve.nativeElement);
    this.resizeObserver = null;
  }
  ngAfterViewChecked() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.tabChanged) {
        this.updateInkBar();
        this.tabChanged = false;
      }
    }
  }
  ngOnDestroy() {
    if (this.tabChangesSubscription) {
      this.tabChangesSubscription.unsubscribe();
    }
    if (this.resizeObserver) {
      this.unbindResizeObserver();
    }
    super.ngOnDestroy();
  }
  getTabHeaderActionId(tabId) {
    return `${tabId}_header_action`;
  }
  getTabContentId(tabId) {
    return `${tabId}_content`;
  }
  initTabs() {
    this.tabs = this.tabPanels.toArray();
    let selectedTab = this.findSelectedTab();
    if (!selectedTab && this.tabs.length) {
      if (this.activeIndex != null && this.tabs.length > this.activeIndex) this.tabs[this.activeIndex].selected = true;
      else this.tabs[0].selected = true;
      this.tabChanged = true;
    }
    this.cd.markForCheck();
  }
  onTabKeyDown(event, tab) {
    switch (event.code) {
      case "ArrowLeft":
        this.onTabArrowLeftKey(event);
        break;
      case "ArrowRight":
        this.onTabArrowRightKey(event);
        break;
      case "Home":
        this.onTabHomeKey(event);
        break;
      case "End":
        this.onTabEndKey(event);
        break;
      case "PageDown":
        this.onTabEndKey(event);
        break;
      case "PageUp":
        this.onTabHomeKey(event);
        break;
      case "Enter":
      case "Space":
        this.open(event, tab);
        break;
      default:
        break;
    }
  }
  onTabArrowLeftKey(event) {
    const prevHeaderAction = this.findPrevHeaderAction(event.currentTarget);
    const index = getAttribute(prevHeaderAction, "data-pc-index");
    prevHeaderAction ? this.changeFocusedTab(event, prevHeaderAction, index) : this.onTabEndKey(event);
    event.preventDefault();
  }
  onTabArrowRightKey(event) {
    const nextHeaderAction = this.findNextHeaderAction(event.currentTarget);
    const index = getAttribute(nextHeaderAction, "data-pc-index");
    nextHeaderAction ? this.changeFocusedTab(event, nextHeaderAction, index) : this.onTabHomeKey(event);
    event.preventDefault();
  }
  onTabHomeKey(event) {
    const firstHeaderAction = this.findFirstHeaderAction();
    const index = getAttribute(firstHeaderAction, "data-pc-index");
    this.changeFocusedTab(event, firstHeaderAction, index);
    event.preventDefault();
  }
  onTabEndKey(event) {
    const lastHeaderAction = this.findLastHeaderAction();
    const index = getAttribute(lastHeaderAction, "data-pc-index");
    this.changeFocusedTab(event, lastHeaderAction, index);
    event.preventDefault();
  }
  changeFocusedTab(event, element, index) {
    if (element) {
      focus(element);
      element.scrollIntoView({
        block: "nearest"
      });
      if (this.selectOnFocus) {
        const tab = this.tabs[index];
        this.open(event, tab);
      }
    }
  }
  findNextHeaderAction(tabElement, selfCheck = false) {
    const headerElement = selfCheck ? tabElement : tabElement.nextElementSibling;
    return headerElement ? getAttribute(headerElement, "data-p-disabled") || getAttribute(headerElement, "data-pc-section") === "inkbar" ? this.findNextHeaderAction(headerElement) : headerElement : null;
  }
  findPrevHeaderAction(tabElement, selfCheck = false) {
    const headerElement = selfCheck ? tabElement : tabElement.previousElementSibling;
    return headerElement ? getAttribute(headerElement, "data-p-disabled") || getAttribute(headerElement, "data-pc-section") === "inkbar" ? this.findPrevHeaderAction(headerElement) : headerElement : null;
  }
  findFirstHeaderAction() {
    const firstEl = this.navbar.nativeElement.firstElementChild;
    return this.findNextHeaderAction(firstEl, true);
  }
  findLastHeaderAction() {
    const lastEl = this.navbar.nativeElement.lastElementChild;
    const lastHeaderAction = getAttribute(lastEl, "data-pc-section") === "inkbar" ? lastEl.previousElementSibling : lastEl;
    return this.findPrevHeaderAction(lastHeaderAction, true);
  }
  open(event, tab) {
    if (tab.disabled) {
      if (event) {
        event.preventDefault();
      }
      return;
    }
    if (!tab.selected) {
      let selectedTab = this.findSelectedTab();
      if (selectedTab) {
        selectedTab.selected = false;
      }
      this.tabChanged = true;
      tab.selected = true;
      let selectedTabIndex = this.findTabIndex(tab);
      this.preventActiveIndexPropagation = true;
      this.activeIndexChange.emit(selectedTabIndex);
      this.onChange.emit({
        originalEvent: event,
        index: selectedTabIndex
      });
      this.updateScrollBar(selectedTabIndex);
    }
    if (event) {
      event.preventDefault();
    }
  }
  close(event, tab) {
    if (this.controlClose) {
      this.onClose.emit({
        originalEvent: event,
        index: this.findTabIndex(tab),
        close: () => {
          this.closeTab(tab);
        }
      });
    } else {
      this.closeTab(tab);
      this.onClose.emit({
        originalEvent: event,
        index: this.findTabIndex(tab)
      });
    }
    event.stopPropagation();
  }
  closeTab(tab) {
    if (tab.disabled) {
      return;
    }
    if (tab.selected) {
      this.tabChanged = true;
      tab.selected = false;
      for (let i = 0; i < this.tabs.length; i++) {
        let tabPanel = this.tabs[i];
        if (!tabPanel.closed && !tab.disabled) {
          tabPanel.selected = true;
          break;
        }
      }
    }
    tab.closed = true;
  }
  findSelectedTab() {
    for (let i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].selected) {
        return this.tabs[i];
      }
    }
    return null;
  }
  findTabIndex(tab) {
    let index = -1;
    for (let i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i] == tab) {
        index = i;
        break;
      }
    }
    return index;
  }
  getBlockableElement() {
    return this.el.nativeElement.children[0];
  }
  updateInkBar() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.navbar) {
        const tabHeader = findSingle(this.navbar.nativeElement, '[data-pc-section="headeraction"][data-p-active="true"]');
        if (!tabHeader) {
          return;
        }
        this.inkbar.nativeElement.style.width = getOuterWidth(tabHeader) + "px";
        this.inkbar.nativeElement.style.left = getOffset(tabHeader).left - getOffset(this.navbar.nativeElement).left + "px";
      }
    }
  }
  updateScrollBar(index) {
    let tabHeader = find(this.navbar.nativeElement, '[data-pc-section="headeraction"]')[index];
    if (tabHeader) {
      tabHeader.scrollIntoView({
        block: "nearest"
      });
    }
  }
  updateButtonState() {
    const content = this.content.nativeElement;
    const {
      scrollLeft,
      scrollWidth
    } = content;
    const width = getWidth(content);
    this.backwardIsDisabled = scrollLeft === 0;
    this.forwardIsDisabled = Math.round(scrollLeft) === scrollWidth - width;
  }
  refreshButtonState() {
    this.container = findSingle(this.el.nativeElement, '[data-pc-section="navcontent"]');
    this.list = findSingle(this.el.nativeElement, '[data-pc-section="nav"]');
    if (this.list.offsetWidth >= this.container.offsetWidth) {
      if (this.list.offsetWidth >= this.container.offsetWidth) {
        this.buttonVisible = true;
      } else {
        this.buttonVisible = false;
      }
      this.updateButtonState();
      this.cd.markForCheck();
    }
  }
  onScroll(event) {
    this.scrollable && this.updateButtonState();
    event.preventDefault();
  }
  getVisibleButtonWidths() {
    return [this.prevBtn?.nativeElement, this.nextBtn?.nativeElement].reduce((acc, el) => el ? acc + getWidth(el) : acc, 0);
  }
  navBackward() {
    const content = this.content.nativeElement;
    const width = getWidth(content) - this.getVisibleButtonWidths();
    const pos = content.scrollLeft - width;
    content.scrollLeft = pos <= 0 ? 0 : pos;
  }
  navForward() {
    const content = this.content.nativeElement;
    const width = getWidth(content) - this.getVisibleButtonWidths();
    const pos = content.scrollLeft + width;
    const lastPos = content.scrollWidth - width;
    content.scrollLeft = pos >= lastPos ? lastPos : pos;
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵTabView_BaseFactory;
    return function TabView_Factory(__ngFactoryType__) {
      return (ɵTabView_BaseFactory || (ɵTabView_BaseFactory = ɵɵgetInheritedFactory(_TabView)))(__ngFactoryType__ || _TabView);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _TabView,
    selectors: [["p-tabView"], ["p-tabview"]],
    contentQueries: function TabView_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _c6, 5);
        ɵɵcontentQuery(dirIndex, _c7, 5);
        ɵɵcontentQuery(dirIndex, TabPanel, 4);
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.previousIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.nextIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.tabPanels = _t);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    viewQuery: function TabView_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 5);
        ɵɵviewQuery(_c8, 5);
        ɵɵviewQuery(_c9, 5);
        ɵɵviewQuery(_c10, 5);
        ɵɵviewQuery(_c11, 5);
        ɵɵviewQuery(_c12, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.content = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.navbar = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.prevBtn = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.nextBtn = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.inkbar = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.elementToObserve = _t.first);
      }
    },
    hostVars: 11,
    hostBindings: function TabView_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("data-pc-name", "tabview");
        ɵɵstyleMap(ctx.hostStyle);
        ɵɵclassMap(ctx.hostClass);
        ɵɵclassProp("p-tabs", true)("p-tabs-scrollable", ctx.scrollable)("p-component", true);
      }
    },
    inputs: {
      style: "style",
      styleClass: "styleClass",
      controlClose: [2, "controlClose", "controlClose", booleanAttribute],
      scrollable: [2, "scrollable", "scrollable", booleanAttribute],
      activeIndex: "activeIndex",
      selectOnFocus: [2, "selectOnFocus", "selectOnFocus", booleanAttribute],
      nextButtonAriaLabel: "nextButtonAriaLabel",
      prevButtonAriaLabel: "prevButtonAriaLabel",
      autoHideButtons: [2, "autoHideButtons", "autoHideButtons", booleanAttribute],
      tabindex: [2, "tabindex", "tabindex", numberAttribute]
    },
    outputs: {
      onChange: "onChange",
      onClose: "onClose",
      activeIndexChange: "activeIndexChange"
    },
    features: [ɵɵProvidersFeature([TabsStyle]), ɵɵInheritDefinitionFeature],
    ngContentSelectors: _c5,
    decls: 12,
    vars: 7,
    consts: [["elementToObserve", ""], ["content", ""], ["navbar", ""], ["prevBtn", ""], ["inkbar", ""], ["nextBtn", ""], [1, "p-tablist"], ["class", "p-tablist-prev-button p-tablist-nav-button", "type", "button", "pRipple", "", 3, "click", 4, "ngIf"], [1, "p-tablist-content", 3, "scroll", "ngClass"], ["role", "tablist", 1, "p-tablist-tab-list"], ["class", "p-tablist-next-button p-tablist-nav-button", "type", "button", "pRipple", "", 3, "click", 4, "ngIf"], [1, "p-tabpanels"], ["type", "button", "pRipple", "", 1, "p-tablist-prev-button", "p-tablist-nav-button", 3, "click"], [4, "ngIf"], [4, "ngTemplateOutlet"], ["pRipple", "", 3, "click", "keydown", "ngClass", "ngStyle", "pTooltip", "tooltipPosition", "positionStyle", "tooltipStyleClass", "disabled"], ["role", "presentation", 1, "p-tablist-active-bar"], [1, "p-tabview-left-icon", 3, "ngClass"], [1, "p-tabview-right-icon", 3, "ngClass"], [3, "click"], ["type", "button", "pRipple", "", 1, "p-tablist-next-button", "p-tablist-nav-button", 3, "click"]],
    template: function TabView_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = ɵɵgetCurrentView();
        ɵɵprojectionDef();
        ɵɵelementStart(0, "div", 6, 0);
        ɵɵtemplate(2, TabView_button_2_Template, 4, 4, "button", 7);
        ɵɵelementStart(3, "div", 8, 1);
        ɵɵlistener("scroll", function TabView_Template_div_scroll_3_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onScroll($event));
        });
        ɵɵelementStart(5, "div", 9, 2);
        ɵɵrepeaterCreate(7, TabView_For_8_Template, 1, 1, null, null, ɵɵrepeaterTrackByIdentity);
        ɵɵelementEnd()();
        ɵɵtemplate(9, TabView_button_9_Template, 4, 3, "button", 10);
        ɵɵelementEnd();
        ɵɵelementStart(10, "div", 11);
        ɵɵprojection(11);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵadvance(2);
        ɵɵproperty("ngIf", ctx.scrollable && !ctx.backwardIsDisabled && ctx.autoHideButtons);
        ɵɵadvance();
        ɵɵproperty("ngClass", ɵɵpureFunction1(5, _c13, ctx.scrollable));
        ɵɵattribute("data-pc-section", "navcontent");
        ɵɵadvance(2);
        ɵɵattribute("data-pc-section", "nav");
        ɵɵadvance(2);
        ɵɵrepeater(ctx.tabs);
        ɵɵadvance(2);
        ɵɵproperty("ngIf", ctx.scrollable && !ctx.forwardIsDisabled && ctx.buttonVisible);
      }
    },
    dependencies: [CommonModule, NgClass, NgIf, NgTemplateOutlet, NgStyle, SharedModule, TooltipModule, Tooltip, Ripple, TimesIcon, ChevronLeftIcon, ChevronRightIcon],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TabView, [{
    type: Component,
    args: [{
      selector: "p-tabView, p-tabview",
      standalone: true,
      imports: [CommonModule, SharedModule, TooltipModule, Ripple, TimesIcon, ChevronLeftIcon, ChevronRightIcon],
      template: `
        <div #elementToObserve class="p-tablist">
            <button
                *ngIf="scrollable && !backwardIsDisabled && autoHideButtons"
                #prevBtn
                class="p-tablist-prev-button p-tablist-nav-button"
                (click)="navBackward()"
                [attr.tabindex]="tabindex"
                [attr.aria-label]="prevButtonAriaLabel"
                type="button"
                pRipple
            >
                <ChevronLeftIcon *ngIf="!previousIconTemplate && !_previousIconTemplate" [attr.aria-hidden]="true" />
                <ng-template *ngTemplateOutlet="previousIconTemplate && _previousIconTemplate"></ng-template>
            </button>
            <div #content class="p-tablist-content" [ngClass]="{ 'p-tablist-viewport': scrollable }" (scroll)="onScroll($event)" [attr.data-pc-section]="'navcontent'">
                <div #navbar class="p-tablist-tab-list" role="tablist" [attr.data-pc-section]="'nav'">
                    @for (tab of tabs; track tab; let i = $index) {
                        @if (!tab.closed) {
                            <button
                                [ngClass]="{
                                    'p-tab': true,
                                    'p-tab-active': tab.selected,
                                    'p-disabled': tab.disabled
                                }"
                                [attr.role]="'tab'"
                                [class]="tab.headerStyleClass"
                                [ngStyle]="tab.headerStyle"
                                [pTooltip]="tab.tooltip"
                                [tooltipPosition]="tab.tooltipPosition"
                                [positionStyle]="tab.tooltipPositionStyle"
                                [tooltipStyleClass]="tab.tooltipStyleClass"
                                [attr.id]="getTabHeaderActionId(tab.id)"
                                [attr.aria-controls]="getTabContentId(tab.id)"
                                [attr.aria-selected]="tab.selected"
                                [attr.tabindex]="tab.disabled || !tab.selected ? '-1' : tabindex"
                                [attr.aria-disabled]="tab.disabled"
                                [disabled]="tab.disabled"
                                [attr.data-pc-index]="i"
                                [attr.data-p-disabled]="tab.disabled"
                                [attr.data-pc-section]="'headeraction'"
                                [attr.data-p-active]="tab.selected"
                                (click)="open($event, tab)"
                                (keydown)="onTabKeyDown($event, tab)"
                                pRipple
                            >
                                @if (tab.headerTemplate || tab._headerTemplate) {
                                    <ng-container *ngTemplateOutlet="tab.headerTemplate || tab._headerTemplate"></ng-container>
                                } @else {
                                    @if (tab.leftIconTemplate || tab._leftIconTemplate) {
                                        <ng-template *ngTemplateOutlet="tab.leftIconTemplate || tab._leftIconTemplate"></ng-template>
                                    } @else if (tab.leftIcon && !tab.leftIconTemplate && !tab._leftIconTemplate) {
                                        <span class="p-tabview-left-icon" [ngClass]="tab.leftIcon"></span>
                                    }
                                    {{ tab.header }}
                                    @if (tab.rightIconTemplate || tab._rightIconTemplate) {
                                        <ng-template *ngTemplateOutlet="tab.rightIconTemplate || tab._rightIconTemplate"></ng-template>
                                    } @else if (tab.rightIcon && !tab.rightIconTemplate && !tab._rightIconTemplate) {
                                        <span class="p-tabview-right-icon" [ngClass]="tab.rightIcon"></span>
                                    }
                                    @if (tab.closable) {
                                        @if (tab.closeIconTemplate || tab._closeIconTemplate) {
                                            <ng-template *ngTemplateOutlet="tab.closeIconTemplate || tab._closeIconTemplate"></ng-template>
                                        } @else {
                                            <TimesIcon (click)="close($event, tab)" />
                                        }
                                    }
                                }
                            </button>
                            <span #inkbar class="p-tablist-active-bar" role="presentation" [attr.aria-hidden]="true" [attr.data-pc-section]="'inkbar'"></span>
                        }
                    }
                </div>
            </div>
            <button *ngIf="scrollable && !forwardIsDisabled && buttonVisible" #nextBtn [attr.tabindex]="tabindex" [attr.aria-label]="nextButtonAriaLabel" class="p-tablist-next-button p-tablist-nav-button" (click)="navForward()" type="button" pRipple>
                @if (nextIconTemplate || _nextIconTemplate) {
                    <ng-template *ngTemplateOutlet="nextIconTemplate || _nextIconTemplate"></ng-template>
                } @else {
                    <ChevronRightIcon [attr.aria-hidden]="true" />
                }
            </button>
        </div>
        <div class="p-tabpanels">
            <ng-content></ng-content>
        </div>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      host: {
        "[class.p-tabs]": "true",
        "[class.p-tabs-scrollable]": "scrollable",
        "[class.p-component]": "true",
        "[attr.data-pc-name]": '"tabview"'
      },
      providers: [TabsStyle]
    }]
  }], null, {
    hostClass: [{
      type: HostBinding,
      args: ["class"]
    }],
    hostStyle: [{
      type: HostBinding,
      args: ["style"]
    }],
    style: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    controlClose: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    scrollable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    activeIndex: [{
      type: Input
    }],
    selectOnFocus: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    nextButtonAriaLabel: [{
      type: Input
    }],
    prevButtonAriaLabel: [{
      type: Input
    }],
    autoHideButtons: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    tabindex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    onChange: [{
      type: Output
    }],
    onClose: [{
      type: Output
    }],
    activeIndexChange: [{
      type: Output
    }],
    content: [{
      type: ViewChild,
      args: ["content"]
    }],
    navbar: [{
      type: ViewChild,
      args: ["navbar"]
    }],
    prevBtn: [{
      type: ViewChild,
      args: ["prevBtn"]
    }],
    nextBtn: [{
      type: ViewChild,
      args: ["nextBtn"]
    }],
    inkbar: [{
      type: ViewChild,
      args: ["inkbar"]
    }],
    tabPanels: [{
      type: ContentChildren,
      args: [TabPanel]
    }],
    elementToObserve: [{
      type: ViewChild,
      args: ["elementToObserve"]
    }],
    previousIconTemplate: [{
      type: ContentChild,
      args: ["previousicon"]
    }],
    nextIconTemplate: [{
      type: ContentChild,
      args: ["nexticon"]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var TabViewModule = class _TabViewModule {
  static ɵfac = function TabViewModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TabViewModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _TabViewModule,
    imports: [TabView, TabPanel, SharedModule],
    exports: [TabView, TabPanel, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [TabView, TabPanel, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TabViewModule, [{
    type: NgModule,
    args: [{
      imports: [TabView, TabPanel, SharedModule],
      exports: [TabView, TabPanel, SharedModule]
    }]
  }], null, null);
})();
export {
  TabPanel,
  TabView,
  TabViewModule,
  TabsClasses,
  TabsStyle
};
//# sourceMappingURL=primeng_tabview.js.map
