import os
import re

# We will look for standard Modal headers and flex containers
# Pattern: <div className="flex items-center justify-between
# We want to ensure its first child has min-w-0

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Just an example of what could be done:
    # Adding min-w-0 to the title divs in UsersPage, OrganizationsPage, AuthModal, AdminOrdersRevenuePage
    
    replacements = [
        # UsersPage.jsx header left part
        (
            '<div className="flex items-center gap-3">\\n                <div className="w-10 h-10 rounded-2xl bg-sky-50',
            '<div className="flex items-center gap-3 min-w-0">\\n                <div className="w-10 h-10 rounded-2xl bg-sky-50 shrink-0'
        ),
        (
            '<div>\\n                  <h2 className="text-lg font-black',
            '<div className="min-w-0 flex-1">\\n                  <h2 className="text-lg font-black truncate'
        ),
        # OrgsPage.jsx 
        (
            '<div className="flex items-center gap-3">\\n                <div className="w-10 h-10 rounded-2xl bg-amber-50',
            '<div className="flex items-center gap-3 min-w-0">\\n                <div className="w-10 h-10 rounded-2xl bg-amber-50 shrink-0'
        ),
        # AuthModal.jsx
        (
            '<div className="flex items-center gap-3">\\n                <div className="w-12 h-12 rounded-xl bg-blue-50',
            '<div className="flex items-center gap-3 min-w-0">\\n                <div className="w-12 h-12 rounded-xl bg-blue-50 shrink-0'
        ),
    ]
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    base_dir = 'src/features'
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.jsx'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
