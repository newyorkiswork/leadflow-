# LeadAI Pro - Figma Design Specifications

## 🎨 Design Token Specifications

### Color Palette

#### Primary Colors
```
Primary 50:  #EFF6FF
Primary 100: #DBEAFE
Primary 200: #BFDBFE
Primary 300: #93C5FD
Primary 400: #60A5FA
Primary 500: #3B82F6 (Main Brand)
Primary 600: #2563EB
Primary 700: #1D4ED8
Primary 800: #1E40AF
Primary 900: #1E3A8A
```

#### Semantic Colors
```
Success:  #10B981
Warning:  #F59E0B
Error:    #EF4444
Info:     #06B6D4
```

#### Neutral Grays
```
Gray 50:  #F8FAFC
Gray 100: #F1F5F9
Gray 200: #E2E8F0
Gray 300: #CBD5E1
Gray 400: #94A3B8
Gray 500: #64748B
Gray 600: #475569
Gray 700: #334155
Gray 800: #1E293B
Gray 900: #0F172A
```

### Typography Scale

#### Font Families
- **Primary**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono

#### Type Scale
```
Display Large:  48px / 56px (3rem / 3.5rem)
Display Medium: 36px / 44px (2.25rem / 2.75rem)
Display Small:  30px / 36px (1.875rem / 2.25rem)

Heading 1: 24px / 32px (1.5rem / 2rem) - Semibold
Heading 2: 20px / 28px (1.25rem / 1.75rem) - Semibold
Heading 3: 18px / 28px (1.125rem / 1.75rem) - Semibold
Heading 4: 16px / 24px (1rem / 1.5rem) - Semibold

Body Large:  18px / 28px (1.125rem / 1.75rem) - Regular
Body Medium: 16px / 24px (1rem / 1.5rem) - Regular
Body Small:  14px / 20px (0.875rem / 1.25rem) - Regular

Caption: 12px / 16px (0.75rem / 1rem) - Medium
```

### Spacing System
```
4px   (0.25rem) - xs
8px   (0.5rem)  - sm
12px  (0.75rem) - md
16px  (1rem)    - lg
20px  (1.25rem) - xl
24px  (1.5rem)  - 2xl
32px  (2rem)    - 3xl
40px  (2.5rem)  - 4xl
48px  (3rem)    - 5xl
64px  (4rem)    - 6xl
```

### Shadow System
```
Shadow SM: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
Shadow MD: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
Shadow LG: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
Shadow XL: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
```

## 🧩 Component Specifications

### 1. Button Components

#### Primary Button
- Background: Primary 600
- Text: White
- Padding: 12px 24px
- Border Radius: 8px
- Font: Body Medium, Semibold
- Hover: Primary 700
- Active: Primary 800
- Disabled: Gray 300

#### Secondary Button
- Background: White
- Border: 1px solid Gray 300
- Text: Gray 700
- Padding: 12px 24px
- Border Radius: 8px
- Hover: Gray 50
- Active: Gray 100

### 2. Input Components

#### Text Input
- Border: 1px solid Gray 300
- Border Radius: 8px
- Padding: 12px 16px
- Font: Body Medium
- Focus: Primary 600 border, Primary 100 background
- Error: Error border, Error 50 background

#### Select Dropdown
- Same styling as text input
- Chevron icon: Gray 400
- Dropdown: White background, Shadow MD
- Option hover: Gray 50

### 3. Card Components

#### Standard Card
- Background: White
- Border: 1px solid Gray 200
- Border Radius: 12px
- Padding: 24px
- Shadow: Shadow SM

#### Interactive Card
- Same as standard card
- Hover: Shadow MD, slight scale (1.02)
- Cursor: pointer

### 4. Navigation Components

#### Sidebar Navigation
- Width: 280px (expanded), 64px (collapsed)
- Background: Gray 900
- Text: Gray 300
- Active item: Primary 600 background, White text
- Hover: Gray 800 background

#### Top Navigation
- Height: 64px
- Background: White
- Border bottom: 1px solid Gray 200
- Shadow: Shadow SM

## 📱 Screen Specifications

### 1. Dashboard Layout
- **Header**: 64px height, contains search, notifications, user menu
- **Sidebar**: 280px width, collapsible to 64px
- **Main Content**: Flexible width, 24px padding
- **Grid System**: 12-column grid with 24px gutters

### 2. Lead Management Interface
- **Filter Bar**: 56px height, contains search and filters
- **Data Table**: Sortable columns, row actions, bulk selection
- **Pagination**: Bottom-aligned, shows total count
- **Action Panel**: Slide-out panel for lead details

### 3. Analytics Dashboard
- **Metric Cards**: 4-column grid on desktop, stacked on mobile
- **Charts**: Responsive containers with consistent styling
- **Date Picker**: Contextual date range selection
- **Export Options**: Accessible via action menu

## 🎯 Interaction Specifications

### Animations & Transitions
- **Duration**: 200ms for micro-interactions, 300ms for page transitions
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) for smooth feel
- **Loading States**: Skeleton screens with subtle pulse animation
- **Hover Effects**: Subtle scale (1.02) and shadow changes

### Responsive Behavior
- **Mobile**: Single column layout, touch-friendly targets (44px minimum)
- **Tablet**: Adaptive grid, collapsible sidebar
- **Desktop**: Full feature set, keyboard shortcuts enabled

## 🔧 Development Handoff

### Figma Plugin Recommendations
1. **Design Tokens**: For consistent token export
2. **Figma to Code**: For component code generation
3. **Accessibility**: For contrast and accessibility checks

### Asset Export Settings
- **Icons**: SVG format, 24x24px base size
- **Images**: WebP format with PNG fallback
- **Logos**: SVG with multiple size variants

### Component Documentation
Each component includes:
- Usage guidelines
- Props and variants
- Accessibility requirements
- Code examples
- Do's and don'ts
