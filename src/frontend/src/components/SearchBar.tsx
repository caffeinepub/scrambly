import { Search, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search Sonic universe...",
  initialValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search
          size={20}
          className="absolute left-4 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-20 py-4 rounded-full border-2 border-primary/30 bg-card text-foreground
                     focus:outline-none focus:border-primary font-nunito text-base shadow-md
                     transition-all duration-200 focus:shadow-sonic"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 bg-primary text-primary-foreground px-4 py-2 rounded-full
                     font-fredoka text-sm hover:opacity-90 active:scale-95 transition-all duration-150"
        >
          Go!
        </button>
      </div>
    </form>
  );
}
