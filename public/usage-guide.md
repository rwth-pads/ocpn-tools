## Introduction

Welcome to OCPN Tools! This tool allows you to create, edit, and simulate Object-Centric Petri Nets (OCPNs). This guide will help you understand how to use the various features of the editor.

## Basic Navigation

- **Toolbar**: Contains tools for creating places, transitions, and arcs
- **Sidebar**: Provides access to properties and declarations
- **Canvas**: The main editing area where you build your Petri Net

## Creating Elements

### Places
- Click the circle icon in the toolbar and drag it onto the canvas
- Configure properties in the sidebar:
  - Label: Name of the place
  - Color Set: Type of tokens the place can hold
  - Initial Marking: Initial tokens in the place. This can contain code expressions like "5+2".

### Transitions
- Click the square icon in the toolbar and drag it onto the canvas
- Configure properties in the sidebar:
  - Label: Name of the transition
  - Guard: Condition that must be true for the transition to fire
  - Time: Time delay for the transition
  - Priority: Execution priority
  - Code Segment: ML code to execute when the transition fires

### Arcs
- Click on a source node, then click on a target node to create an arc
- Configure the arc inscription in the sidebar

You can use the following notation for multisets:
```
✅ [x,x] --> consume the same token twice
❌ [x,y] --> not supported to bind two tokens
✅ [x,x,x,x,x] --> consume five tokens with the same value
```

For legacy reasons, we also support the Standard ML notation used in CPN Tools:
```
✅ 2`x --> consume the same token twice
```

## Declarations

### Color Sets
Define the types of tokens that can be used in your Petri Net:
- Basic types: INT, BOOL, STRING
- Compound types: lists, records, products

### Variables
Define variables that can be used in arc inscriptions and guards.

### Functions
Define ML functions that can be used in your Petri Net.

## Code Expressions

Code expressions can be used for arc inscriptions, guards, and initial markings.

Here are some examples of valid code expressions for arc inscriptions:

```
✅ 1
✅ var1
✅ "test"
```
OCPN Tools will always try to bind a variable, therefore, a simple string like this will not work (except if "test" is a declared variable):
```
❌ test
```
You can even use a ternary expression like this:
```
✅ if y < 2 { 5 } else { 10 }
```

## Tips and Tricks

- Use the layout tools to automatically arrange your Petri Net
- Save your work frequently using the save button
- Use the AI Assistant for help with specific modeling questions
