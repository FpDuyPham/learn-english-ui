# PrimeNG Wrapper Components

Reusable wrapper components for PrimeNG UI library. These wrappers provide:
- Consistent styling across the application
- Simplified API for common use cases
- Type safety and Angular Forms integration
- Easy migration path if changing UI library

## Available Components

### 1. AppButtonComponent
**Selector:** `app-button`  
**Wrapper for:** `p-button`

#### Usage
```typescript
import { AppButtonComponent } from '@shared/ui';

@Component({
  standalone: true,
  imports: [AppButtonComponent]
})
export class MyComponent {}
```

```html
<!-- Basic usage -->
<app-button 
  label="Click Me" 
  (clicked)="handleClick()">
</app-button>

<!-- With icon -->
<app-button 
  label="Save" 
  icon="pi pi-check" 
  severity="success"
  (clicked)="save()">
</app-button>

<!-- Loading state -->
<app-button 
  label="Processing..." 
  [loading]="isLoading"
  [disabled]="isLoading">
</app-button>
```

#### Inputs
- `label` - Button text
- `icon` - PrimeIcons class
- `severity` - Button color variant (primary | secondary | success | info | warn | danger)
- `size` - Button size (small | large)
- `outlined`, `raised`, `rounded`, `text` - Style variants
- `disabled`, `loading` - State flags
- `type` - HTML button type (button | submit | reset)

#### Outputs
- `clicked` - Emits when button is clicked (if not disabled/loading)

---

### 2. AppInputComponent
**Selector:** `app-input`  
**Wrapper for:** `p-inputText`

#### Usage
```typescript
import { AppInputComponent } from '@shared/ui';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [AppInputComponent, FormsModule]
})
export class MyComponent {
  username = '';
}
```

```html
<!-- With ngModel -->
<app-input 
  label="Username" 
  [(ngModel)]="username"
  placeholder="Enter username">
</app-input>

<!-- With Reactive Forms -->
<app-input 
  label="Email" 
  formControlName="email"
  type="email"
  [invalid]="form.get('email')?.invalid"
  errorMessage="Please enter a valid email">
</app-input>

<!-- With helper text -->
<app-input 
  label="Password" 
  type="password"
  helperText="Must be at least 8 characters">
</app-input>
```

#### Inputs
- `label` - Float label text
- `placeholder` - Placeholder text
- `type` - Input type (text | email | password | number | tel | url)
- `disabled`, `readonly` - State flags
- `invalid` - Show error state
- `errorMessage` - Error message to display
- `helperText` - Helper text below input

#### Forms Integration
Implements `ControlValueAccessor` - works with both Template-driven and Reactive Forms.

---

### 3. AppCardComponent
**Selector:** `app-card`  
**Wrapper for:** `p-card`

#### Usage
```typescript
import { AppCardComponent } from '@shared/ui';

@Component({
  standalone: true,
  imports: [AppCardComponent]
})
export class MyComponent {}
```

```html
<!-- Simple card -->
<app-card header="Title" subheader="Subtitle">
  <p>Card content goes here</p>
</app-card>

<!-- With custom header and footer -->
<app-card [headerTemplate]="true" [footerTemplate]="true">
  <div header>
    <h3>Custom Header</h3>
  </div>

  <p>Main content</p>

  <div footer>
    <app-button label="Action"></app-button>
  </div>
</app-card>
```

#### Inputs
- `header` - Header text (simple mode)
- `subheader` - Subheader text
- `headerTemplate` - Enable custom header projection
- `footerTemplate` - Enable custom footer projection
- `customClass` - Additional CSS classes

---

### 4. AppDialogComponent
**Selector:** `app-dialog`  
**Wrapper for:** `p-dialog`

#### Usage
```typescript
import { AppDialogComponent } from '@shared/ui';

@Component({
  standalone: true,
  imports: [AppDialogComponent]
})
export class MyComponent {
  showDialog = false;

  closeDialog() {
    this.showDialog = false;
  }
}
```

```html
<!-- Basic dialog -->
<app-dialog 
  header="Confirmation" 
  [(visible)]="showDialog"
  (hide)="handleClose()">
  <p>Are you sure you want to proceed?</p>
</app-dialog>

<!-- With custom footer -->
<app-dialog 
  header="Details" 
  [(visible)]="showDialog"
  [footerTemplate]="true">
  <p>Dialog content</p>

  <div footer>
    <app-button label="Cancel" (clicked)="closeDialog()"></app-button>
    <app-button label="OK" severity="success" (clicked)="confirm()"></app-button>
  </div>
</app-dialog>
```

#### Inputs
- `visible` - Two-way binding for dialog visibility
- `header` - Dialog header text
- `modal` - Enable modal overlay
- `closable` - Show close button
- `dismissableMask` - Close on mask click
- `position` - Dialog position (center | top | bottom | left | right)
- `maximizable` - Enable maximize button

#### Outputs
- `visibleChange` - Emits when visibility changes
- `hide` - Emits when dialog is closed

---

## Import Path Alias
Configure your `tsconfig.json` for cleaner imports:
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/ui": ["src/app/shared/ui"]
    }
  }
}
```

Then import:
```typescript
import { AppButtonComponent, AppInputComponent } from '@shared/ui';
```
