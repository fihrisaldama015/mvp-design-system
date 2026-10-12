# SHIELD — Base Component: inventory

Read on 2026-10-12 from a local copy ("SHIELD - Base Component (Copy)") through the
Desktop Bridge plugin (figma-console MCP, local mode). Read-only: nothing in Figma was
changed. The original file is view-only for us; plugins only run on the copy.

## Totals

- **219 component sets** and **41 single components**, on about 90 pages.
- **0 local variables.** Every variable and text style used by the components is
  *remote*: it comes from the **Graphene — Foundation** library. Graphene must become
  the foundation (tokens) in code before SHIELD components can be built from it.

## Foundation usage (pilot: Button, Input, Badge, Checkbox, Accordion, default variant)

| Check | Result |
|---|---|
| Variables used | 42, all remote (Graphene): `+Theme` 26, `Spacing` 8, `Typography` 7, `Sizing` 1 |
| Solid fills | 31 bound to a variable, **0 hardcoded** |
| Text styles | 4, all remote: `Semi Bold/text-sm`, `Medium/text-xs`, `Regular/text-sm`, `Regular/text-xs` |

Examples: `color/text/default`, `color/background/default/default`, `border/radius/default`,
`sizing/component sm`, `space-2`, `font-size/sm`, `line-height/sm`, `font-weight/semi-bold`,
`typography/font-family/default`.

## Pilot component properties

| Component | Variant properties | Other properties |
|---|---|---|
| Button | Kind `filled\|outlined\|dashed\|text`, Status `default\|primary\|info\|success\|warning\|danger`, State `default\|hovered\|pressed`, Size `md*\|lg\|sm`, Disabled, Loading | Label (bool), Label Text, Prefix/Suffix Icon (bool + instance swap) |
| Input | State `default\|hovered\|pressed\|filled-pressed\|filled\|filled-hovered`, Size `sm\|md*\|lg`, Disabled, Read-only, Status `default\|info\|success\|warning\|danger` | Label, Label Text, Required, Placeholder (+ text), Value Text, Caption (+ text), Info/Prefix/Suffix/Clearable icons, Label Elements |
| Badge | Kind `text\|icon\|default\|text+prefix+suffix\|text+prefix\|text+suffix`, Status `warning\|default\|info\|danger\|success\|orange\|purple\|brand`, Size `sm\|md*\|lg\|xs`, Style `Soft\|Solid\|Outlined`, Shape `rounded\|full rounded` | Badge Text, Prefix/Suffix Icon (instance swap) |
| Checkbox | Variant `Default\|With Description`, Checked, State `default\|hovered\|pressed`, Size `sm\|md*\|lg`, Indeterminate, Disabled, Read-only, Shape `circle\|square`, Danger | Label (+ text), Danger Caption (+ text), Required |
| Accordion | Size `sm\|md*\|lg`, Disabled, Expand State | Content **Slot**, Title, Helper (+ text), Prefix Icon, Avatar, Dot Badge, Label Badge, Prefix/Suffix Content, Suffix Text, Suffix Icon |

## Translation rules found so far (Figma → code)

- **Variant counts are the full matrix** (Badge 945, Chip 720, Button 360). In code they
  become props; stories show the meaningful states, not every combination.
- **`State` = default/hovered/pressed** is interaction, not a prop: `:hover` / `:active`.
- **`md*`**: the asterisk seems to mark the default size (same in every component).
  To confirm with the designer.
- **`SLOT` properties** (Accordion "Content Slot") become `children`.
- **Instance-swap icon properties** become an icon prop (a lucide icon in code).
- **Names starting with `.`** (`.Drawer`, `.Modal`, `.Listbox`, `.Popover with Arrow`)
  look like internal base parts used by the public component.
- **Pages starting with `~`** are page blocks (website, e-commerce, content), not base
  components: they belong in a `Blocks/` group.
- **SWT-specific parts** (Booking List calendar cards, Table cells for NRIC / Lane /
  Blackout Dates / Best Attempt, System Health) are app-specific; keep apart from the
  generic library.

## Component sets per page

Format: `Set (variants / properties)`. Single components in *italics*.

### Application

| Page | Component sets |
|---|---|
| Design Annotations | Sticker (8/6), Flag (2/1), *Notes* |
| Accordion | Accordion (12/15), Accordion Group (63/4), Accordion Item/Content (2/2) |
| Alert | Alert (60/9), Alert - Booking Conflict with Blackout (3/1), *Alert - System Health* |
| Avatar | Avatar Group (12/2), Avatar with Status (96/7), Avatar (120/7), Avatar Item/Badge Orientation (16/2), Avatar Item/Badge Dot (40/3) |
| Badge | Badge (945/8), Badge Number (48/5) |
| Button | Button (360/12), Button Icon (194/8), Button Icon Rounded (192/8) |
| Button Group | Button Group (18/2) |
| Button Link | Link (72/13) |
| Breadcrumb | Breadcrumb (36/3), Breadcrumb v2 (3/2) |
| Calendar | Dashboard - Calendar Card - Day (5/1), Booking List - Calendar Card - Month Item (195/4), Dashboard - Calendar Card - Month (9/2), Booking List - Calendar Card - Month (9/2), Calendar Indicator - Current Time (2/1) |
| Cell - Notification | Notifications List (8/2) |
| Control - Checkbox | Checkbox Group (96/11), Checkbox Group with Description (24/11), Checkbox (216/14) |
| Control - Radio | Radio Group (48/8), Radio Group with Description (24/8), Radio (96/9) |
| Control - ChoiceTile | ChoiceTile Group (6/8), ChoiceTile (20/11) |
| Chip Advanced | Chip Advanced (8/10), Chip Advanced Item (6/2) |
| Chip | Chip (720/11), Chip Item/Avatar (36/4) |
| Date Picker | Date Picker/date-item (16/2), .xDate Picker - Booking (4/1), Date Picker - Filter (2/1), Date Picker (2/1), Date Picker - Month Filter (2/1), Date Picker - Booking (8/2), Date Picker Range (2/1), *.Date Picker - Month*, *.Datetime Picker*, *.Date Picker - Date Range* |
| Divider | Divider (10/2) |
| Dropzone | Dropzone (4/1), .Dropzone Uploaded (2/1), Dropzone Attachment Item (1/2), *.Attachment File* |
| Drawer | .Drawer (12/12), Drawer Right (5/2) |
| Empty State | Empty State (2/2) |
| Feedback | Feedback (48/3) |
| Input | .Predefined Input (81/14), Input (84/18), Input/Predefined Icons (18/2), Input - Phone No (39/18), Input - Name With Rank (39/18), Input - Stepper Right (39/15), Input - Stepper (39/15) |
| Input-Attachment | Input-Attachment (48/14), Attachment Item (6/2) |
| Input-Multiple Select | Input - Multiple Select (6/2), Input - Multiple Select/Base (30/17) |
| Input-Password | Input - Password (78/5), Password Parameter (4/2) |
| Input-Repeatable | Input - Repeatable (10/4) |
| Input-Search | Input - Search (24/3), Input - Search Top Bar (7/13), Search Item-Badges (8/1), Popover - Search Result (2/2), *Search Result List - SWT*, *Search Item-Header*, *Search Item-List* |
| Input-Single Select | Input - Single Select (6/2), Input - Single Select-Courseware (2/2), Input - Single Select Creatable (6/2), Input - Single Select/Base (30/18), Input - Single Select/Base-SelectCourseware (4/14), Input - Single Select Creatable/Base (30/18) |
| Input-Summary | Input-Summary (Read Only) (2/2) |
| Input-Textarea | Text Area (69/15) |
| Link Page | *Link Page* |
| Listbox | .Listbox (21/2), Listbox New (42/5), .Listbox Item/Single Item (15/13), Listbox Item/Single Item New (66/10), Listbox Item/Search (3/1), *Prefix Listbox Item - Icon / Icon Danger / Icon Link*, *Listbox Item - Radio / Checkbox / Avatar / Badge / Text* |
| Modal | .Modal (3/9), Modal (10/3), Modal Confirmation (12/3), Modal Alarm (1/1) |
| Navigation - Sidebar | Sidebar Item/Header (2/2), Sidebar Item/Menu (18/3), Sidebar Item/Menu Icon (6/3), Sidebar Item/SubMenu Lv 1 (18/3), Sidebar Item/SubMenu Lv 2 (18/3), Sidebar Item/Program (21/3), Sidebar Floating Item/Menu (27/3), Sidebar Floating Item/SubMenu Lv 1 (27/3), Sidebar Floating Item/SubMenu Lv 2 (27/3) |
| Navigation - Top Bar | Header Nav (3/1) |
| Pagination | Pagination (2/1) |
| Popconfirm | Popconfirm (216/8) |
| Popover | .Popover with Arrow (216/7), Popover (18/7) |
| Progress | Progress (98/12), Progress Item/Circle Progress (6/4) |
| Progress Wizard | Progress Wizard Item (3/2) |
| Rating | Rating (44/2) |
| Result | Result (4/3) |
| Scrim | *Scrim* |
| Scroll Bar | Scroll Bar (6/2) |
| Segmented Picker | Segmented Picker sm (36/3), Segmented Picker Icon sm (36/3), Segmented Picker md (36/3), Segmented Picker Icon md (36/3), Segmented Picker Item/Base (72/10), Segmented Picker Item/Base Icon (72/6) |
| Slider | Slider (18/10) |
| Sliders Dot Pagination | Sliders Dot Big - Item (2/1), Sliders Dot Big (14/2) |
| Space | *Space Frame* |
| Table | Table - Body Cell (32/11), Table - Header Cell (5/1), Table - Body Cell - Rank Leaderboard (4/1), Table - Collapsible (2/1), Table - Body Cell - Lane (4/1), Table - Body Cell - Blackout Dates (30/4), Table - Body Cell - NRIC (40/3), Table - Body Cell - Date (10/2), Table - Header Cell Sm (5/1), Table - Body Cell Sm (29/5), Table - Body Cell - Best Attempt (10/2) |
| Bulk Action Bar | *Table - Bulk Action Bar* |
| Tabs | .Tab Group (54/3), Tab Group v2 (18/2), Advanced Tab Group (10/2), Box Tab Group (26/3), Box Tab Vertical Group (7/3), .Tab Item/Base (48/11), Tab Item/Base v2 (4/4), Advanced Tab Item/Base (2/2), Tab Item/Box Tab Vertical (2/5), Tab Item/Box Tab Horizontal (6/5), Tab Item/Box Tab Horizontal Colored (24/4) |
| Text | Text (9/2) |
| Page Header | Page Header/Left Content (11/2), *Page Header*, *Segmented Calendar / Button Secondary / Icon Button / Button Primary (Page Header - Right Content)* |
| Section Header | Section Header (2/2), Section Header/Left Content (7/1), right-content parts: Search (6/2), Filter Text (2/1), Select Date (3/2), Select Date Range (3/2), Calendar Navigator (3/1), Segmented Calendar (10/2), plus 9 single parts |
| Sub-Section Header | Sub-Section Header (3/3), Sub-Section Header/Left Content (8/2), Sub-Section Header - Lane Config (19/4), Lane Text (12/4), plus 5 single right-content parts |
| Sub-Section Lv 2 Header | Sub-Section Lv 2 Header (1/1), Left Content (5/1), Colored (System Health) (2/1), for Drawer Item Header (2/1) |
| Drawer Header | Drawer Header (3/1) |
| Modal Header | *Modal Header* |
| Key Value | Key Value (40/3), Key Value - Icon Value (2/6), Key Value sm (35/3), Key Value - System Health (24/3) |
| Toast | Toast (54/7), Toast with Container (6/2) |
| Toggle | Toggle (204/20) |
| Tooltip | Tooltip (36/3) |

### Blocks (pages starting with `~`, 3 variants each unless noted)

| Group | Blocks |
|---|---|
| Website / marketing | Authentication 01–02, Feedback 01–02, Insight Card 01–02, Profile Header 01–02, Sidebar 01–02, Widget 01–02, Cookies 01–02, FAQ 01–02, Feature Section 01–02, Footer 01–02, Header 01–02, Hero Section 01–02, Team 01–02, Testimonial 01–02 |
| E-commerce | Add Card Details 01, Checkout Address 01–02, Checkout Sub Total 01, Order List 01–02, Order Info 01–02, Offer Modal 01, Payment Method 01, Product Card 01–02, Product Comments 01, Product View 01–02, Saved Cards 01 |
| Content | Blog Card 01–02, Blog Left Menu 01, Blog Overview 01, Blog Body 01, Comments 01, Comment Entry 01, Discussion Card 01 |
