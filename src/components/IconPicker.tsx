'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Icon {
  id: string;
  name: string;
  display_name: string;
  category: string;
  svg_content: string;
  color?: string;
}

interface IconPickerProps {
  value?: string; // The SVG content or name of the selected icon
  onChange: (svgContent: string, iconName: string) => void;
  className?: string;
  placeholder?: string;
}

export function IconPicker({ value, onChange, className, placeholder = "Select icon" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qadam-backend-production.up.railway.app/api/v1';

  useEffect(() => {
    if (open && icons.length === 0) {
      fetchIcons();
    }
  }, [open]);

  // Find selected icon from value
  useEffect(() => {
    if (value && icons.length > 0) {
      const found = icons.find(i => i.svg_content === value || i.name === value);
      if (found) {
        setSelectedIcon(found);
      }
    }
  }, [value, icons]);

  const fetchIcons = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/icons`);
      if (response.ok) {
        const data: Icon[] = await response.json();
        setIcons(data);
        
        // Extract unique categories
        const cats = [...new Set(data.map(i => i.category))];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Failed to fetch icons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (icon: Icon) => {
    setSelectedIcon(icon);
    onChange(icon.svg_content, icon.name);
    setOpen(false);
  };

  const filteredIcons = selectedCategory === 'all' 
    ? icons 
    : icons.filter(i => i.category === selectedCategory);

  const renderSvg = (svgContent: string, color?: string) => {
    // Add color to the SVG if provided
    let styledSvg = svgContent;
    if (color) {
      styledSvg = svgContent.replace('stroke="currentColor"', `stroke="${color}"`);
    }
    return (
      <div 
        className="w-6 h-6"
        dangerouslySetInnerHTML={{ __html: styledSvg }}
      />
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-start", className)}
        >
          {selectedIcon ? (
            <div className="flex items-center gap-2">
              {renderSvg(selectedIcon.svg_content, selectedIcon.color)}
              <span>{selectedIcon.display_name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <div className="border-b px-3 py-2">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="text-xs px-2 capitalize"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <ScrollArea className="h-64">
              <div className="grid grid-cols-5 gap-1 p-2">
                {filteredIcons.map(icon => (
                  <button
                    key={icon.id}
                    onClick={() => handleSelect(icon)}
                    className={cn(
                      "p-2 rounded-md hover:bg-accent flex items-center justify-center transition-colors",
                      selectedIcon?.id === icon.id && "bg-accent ring-2 ring-primary"
                    )}
                    title={icon.display_name}
                  >
                    {renderSvg(icon.svg_content, icon.color)}
                  </button>
                ))}
              </div>
              {filteredIcons.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No icons available
                </div>
              )}
            </ScrollArea>
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}
