import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, Copy, Check, Shield, Palette, Info, SearchX,
  Home, Settings, User, Mail, Phone, Calendar, Clock, MapPin,
  Heart, Star, Bookmark, Flag, Tag, MessageSquare, MessageCircle,
  Send, Trash2, Edit, Plus, Minus, X, Check as CheckIcon,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ArrowRight,
  ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock,
  Upload, Download, File, Folder, Image, Video, Music, FileText,
  Save, Share, Link, ExternalLink, Bell, BellOff, Menu, MoreVertical,
  MoreHorizontal, AlertCircle, AlertTriangle, CheckCircle, XCircle,
  HelpCircle, AlertOctagon, Zap, Battery, Wifi, WifiOff, Bluetooth,
  Camera, Mic, Video as VideoIcon, Volume2, VolumeX, Play, Pause,
  SkipBack, SkipForward, Repeat, Shuffle, Radio, Tv, Monitor,
  Smartphone, Tablet, Laptop, Printer, HardDrive, Server, Database,
  Cloud, CloudOff, Compass, Navigation, Map, MapPinned, Globe,
  Sun, Moon, CloudRain, CloudSnow, Wind, Umbrella, Thermometer,
  Users, UserPlus, UserMinus, UserCheck, UserX, Award, Target,
  TrendingUp, TrendingDown, BarChart, PieChart, Activity, Layers,
  Grid, List, Filter, Sliders, Package, ShoppingCart, ShoppingBag,
  CreditCard, DollarSign, Percent, Gift, Truck, Briefcase, Building,
  BookOpen, Book, BookText, Newspaper, FileEdit, FilePlus, FileMinus,
  Clipboard, ClipboardCheck, Scissors, PenTool, Feather, Type, Bold,
  Italic, Underline, AlignLeft, AlignCenter, AlignRight, Code,
  Terminal, GitBranch, Github, Gitlab, Coffee, Pizza, Beer, Utensils,
  QrCode, Scan, Cpu, HardDriveDownload, HardDriveUpload, Shield as ShieldIcon
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { showSuccess } from '@/components/ToastrNotification';

// Icon collection with categories
const ICON_CATEGORIES = {
  'Navigation': [
    'Home', 'Settings', 'Menu', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'MoreVertical', 'MoreHorizontal',
    'Compass', 'Navigation', 'Map', 'MapPinned', 'MapPin'
  ],
  'User & People': [
    'User', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'Award', 'Target'
  ],
  'Communication': [
    'Mail', 'Phone', 'MessageSquare', 'MessageCircle', 'Send', 'Bell', 'BellOff'
  ],
  'Actions': [
    'Plus', 'Minus', 'X', 'Check', 'Edit', 'Trash2', 'Save', 'Share', 'Upload', 'Download',
    'Copy', 'Scissors', 'Eye', 'EyeOff', 'Lock', 'Unlock'
  ],
  'Files & Documents': [
    'File', 'FileText', 'FileEdit', 'FilePlus', 'FileMinus', 'Folder', 'Clipboard',
    'ClipboardCheck', 'BookOpen', 'Book', 'BookText', 'Newspaper'
  ],
  'Media': [
    'Image', 'Video', 'Music', 'Camera', 'Mic', 'Volume2', 'VolumeX', 'Play', 'Pause',
    'SkipBack', 'SkipForward', 'Repeat', 'Shuffle', 'Radio', 'Tv', 'Monitor'
  ],
  'Status & Alerts': [
    'AlertCircle', 'AlertTriangle', 'AlertOctagon', 'CheckCircle', 'XCircle', 'HelpCircle',
    'Info', 'Zap'
  ],
  'Commerce & Business': [
    'ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'Percent', 'Gift', 'Truck',
    'Package', 'Briefcase', 'Building'
  ],
  'Data & Analytics': [
    'BarChart', 'PieChart', 'TrendingUp', 'TrendingDown', 'Activity', 'Database', 'Server',
    'HardDrive', 'Layers', 'Grid', 'List', 'Filter', 'Sliders'
  ],
  'Technology': [
    'Smartphone', 'Tablet', 'Laptop', 'Monitor', 'Printer', 'Cpu', 'Wifi', 'WifiOff',
    'Bluetooth', 'Cloud', 'CloudOff', 'Terminal', 'Code', 'GitBranch', 'Github', 'Gitlab',
    'QrCode', 'Scan'
  ],
  'Nature & Weather': [
    'Sun', 'Moon', 'CloudRain', 'CloudSnow', 'Wind', 'Umbrella', 'Thermometer', 'Globe'
  ],
  'Social & Misc': [
    'Heart', 'Star', 'Bookmark', 'Flag', 'Tag', 'Coffee', 'Pizza', 'Beer', 'Utensils',
    'Calendar', 'Clock', 'Link', 'ExternalLink', 'Shield', 'Battery'
  ],
  'Text Editing': [
    'Type', 'Bold', 'Italic', 'Underline', 'AlignLeft', 'AlignCenter', 'AlignRight',
    'PenTool', 'Feather'
  ]
};

// Map icon names to components
const ICON_MAP = {
  Home, Settings, User, Mail, Phone, Calendar, Clock, MapPin,
  Heart, Star, Bookmark, Flag, Tag, MessageSquare, MessageCircle,
  Send, Trash2, Edit, Plus, Minus, X, Check: CheckIcon,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ArrowRight,
  ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock,
  Upload, Download, File, Folder, Image, Video, Music, FileText,
  Save, Share, Link, ExternalLink, Bell, BellOff, Menu, MoreVertical,
  MoreHorizontal, AlertCircle, AlertTriangle, CheckCircle, XCircle,
  HelpCircle, AlertOctagon, Zap, Battery, Wifi, WifiOff, Bluetooth,
  Camera, Mic, VideoIcon, Volume2, VolumeX, Play, Pause,
  SkipBack, SkipForward, Repeat, Shuffle, Radio, Tv, Monitor,
  Smartphone, Tablet, Laptop, Printer, HardDrive, Server, Database,
  Cloud, CloudOff, Compass, Navigation, Map, MapPinned, Globe,
  Sun, Moon, CloudRain, CloudSnow, Wind, Umbrella, Thermometer,
  Users, UserPlus, UserMinus, UserCheck, UserX, Award, Target,
  TrendingUp, TrendingDown, BarChart, PieChart, Activity, Layers,
  Grid, List, Filter, Sliders, Package, ShoppingCart, ShoppingBag,
  CreditCard, DollarSign, Percent, Gift, Truck, Briefcase, Building,
  BookOpen, Book, BookText, Newspaper, FileEdit, FilePlus, FileMinus,
  Clipboard, ClipboardCheck, Scissors, PenTool, Feather, Type, Bold,
  Italic, Underline, AlignLeft, AlignCenter, AlignRight, Code,
  Terminal, GitBranch, Github, Gitlab, Coffee, Pizza, Beer, Utensils,
  QrCode, Scan, Cpu, HardDriveDownload, HardDriveUpload, Shield: ShieldIcon,
  Search, Copy, Palette, Info, SearchX
};

export default function IconLibrary() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIcon, setCopiedIcon] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = sessionStorage.getItem('appUserAuth');
        if (appUserAuth) {
          setCurrentUser(JSON.parse(appUserAuth));
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const copyToClipboard = (iconName) => {
    const importStatement = `import { ${iconName} } from 'lucide-react';`;
    navigator.clipboard.writeText(importStatement);
    setCopiedIcon(iconName);
    showSuccess(`Copied: ${iconName}`)
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  // Get all icons based on category and search
  const getFilteredIcons = () => {
    let icons = [];
    
    if (selectedCategory === 'All') {
      icons = Object.values(ICON_CATEGORIES).flat();
    } else {
      icons = ICON_CATEGORIES[selectedCategory] || [];
    }

    if (searchQuery) {
      icons = icons.filter(iconName =>
        iconName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return [...new Set(icons)].sort();
  };

  const filteredIcons = getFilteredIcons();

  if (loadingUser) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Hanya superadmin boleh akses halaman ini</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Superadmin Dashboard', page: 'SuperadminDashboard' },
        { label: 'Icon Library', page: 'IconLibrary' }
      ]} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-6 h-6 text-purple-600" />
          Icon Library
        </h1>
        <p className="text-gray-500 mt-1">
          {filteredIcons.length} icon(s) available • Lucide React
        </p>
      </div>

      {/* Search & Filter */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search icons by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === 'All'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {Object.keys(ICON_CATEGORIES).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Icons Grid */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredIcons.map((iconName) => {
              const IconComponent = ICON_MAP[iconName];
              if (!IconComponent) return null;
              
              return (
                <Card
                  key={iconName}
                  className="group hover:shadow-lg transition-all cursor-pointer border hover:border-purple-400"
                  onClick={() => copyToClipboard(iconName)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 flex items-center justify-center text-gray-700 group-hover:text-purple-600 transition-colors">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="text-center w-full">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {iconName}
                      </p>
                      {copiedIcon === iconName ? (
                        <Check className="w-3 h-3 mx-auto mt-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mx-auto mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12">
              <SearchX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No icons found matching "{searchQuery}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card className="border-0 shadow-md bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            Click any icon to copy its import statement to your clipboard. 
            Example: <code className="bg-white px-2 py-1 rounded text-xs">import &#123; Home &#125; from 'lucide-react';</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}