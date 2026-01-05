import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Breadcrumb({ items }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="h-8 w-8 p-0"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      
      <nav className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (            
            <span
              key={item.page || item.label || index}
              className="flex items-center gap-2"
            >
              {/* Chevron separator (not shown for first item) */}
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}

              {/* Last item = current page (not clickable) */}
              {isLast ? (
                <span
                  className="text-gray-900 dark:text-white font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                /* Intermediate items = links */
                <Link
                  to={createPageUrl(item.page)}
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </span>
          );

          {/*
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              
              {isLast ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <Link
                  to={createPageUrl(item.page)}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          */}
        })}
      </nav>
    </div>
  );
}