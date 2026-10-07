import React, { useState, useEffect, useRef } from 'react';
import { sidebarStyles } from '../assets/dummyStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, ArrowUp, ArrowDown, User, HelpCircle, LogOut, Menu, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const MENU_ITEMS = [
  { text: "Dashboard", path: "/", icon: <Home size={20} /> },
  { text: "Income", path: "/income", icon: <ArrowUp size={20} /> },
  { text: "Expenses", path: "/expense", icon: <ArrowDown size={20} /> },
  { text: "Profile", path: "/profile", icon: <User size={20} /> },
];

const Sidebar = ({ user, isCollapsed, setSidebarCollapsed: setIsCollapsed }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHover, setActiveHover] = useState(null);

  const { name: username = "Hexa", email = "hex@gmail.com" } = user || {};
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        mobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => setIsCollapsed((c) => !c);

  const renderMenuItem = ({ text, path, icon }) => {
    const isActive = pathname === path;
    return (
      <motion.li key={text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          to={path}
          onClick={() => setMobileOpen(false)}
          className={cn(
            sidebarStyles.menuItem.base,
            isActive ? sidebarStyles.menuItem.active : sidebarStyles.menuItem.inactive,
            isCollapsed ? sidebarStyles.menuItem.collapsed : sidebarStyles.menuItem.expanded
          )}
          onMouseEnter={() => setActiveHover(text)}
          onMouseLeave={() => setActiveHover(null)}
        >
          <span className={isActive ? sidebarStyles.menuIcon.active : sidebarStyles.menuIcon.inactive}>
            {icon}
          </span>
          {!isCollapsed && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {text}
            </motion.span>
          )}
          {activeHover === text && !isActive && !isCollapsed && (
            <span className={sidebarStyles.activeIndicator}></span>
          )}
        </Link>
      </motion.li>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile viewports) */}
      <motion.aside
        className="hidden md:block relative bg-white border-r border-gray-200 z-30 h-[calc(100vh-64px)] shrink-0"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isCollapsed ? 80 : 256 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {/* Toggle Collapse Arrow Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            sidebarStyles.toggleButton?.base ||
            "absolute -right-3.5 top-6 z-50 flex items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md text-gray-600 hover:text-teal-600 transition-colors"
          )}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex flex-col h-full p-4 justify-between">
          {/* Top Section */}
          <div>
            {/* User Profile Card */}
            <div
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                boxSizing: 'border-box'
              }}
              className={cn(
                "p-2 rounded-xl bg-gray-50/50 border border-gray-100 transition-colors cursor-pointer",
                isCollapsed ? "justify-center p-2" : ""
              )}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: '12px',
                  minWidth: 0,
                  flex: 1
                }}
              >
                {/* Avatar with Green Status Indicator */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {initial}
                  </div>
                  <span style={{ position: 'absolute', bottom: 0, right: 0 }} className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                {/* Name & Email (Hidden when collapsed) */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <span className="font-bold text-gray-900 text-sm truncate" style={{ display: 'block', width: '100%' }}>{username}</span>
                    <span className="text-xs text-gray-500 truncate" style={{ display: 'block', width: '100%' }}>{email}</span>
                  </div>
                )}
              </div>

              {/* Dropdown Arrow */}
              {!isCollapsed && (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              )}
            </div>

            {/* Menu Items */}
            <ul className="mt-6 space-y-2">
              {MENU_ITEMS.map((item) => renderMenuItem(item))}
            </ul>
          </div>

          {/* Footer Section */}
          <div
            className={cn(
              sidebarStyles.footerContainer.base,
              isCollapsed
                ? sidebarStyles.footerContainer.collapsed
                : sidebarStyles.footerContainer.expanded
            )}
          >
            <a
              className={cn(
                sidebarStyles.footerLink.base,
                isCollapsed && sidebarStyles.footerLink.collapsed
              )}
              href="https://hexagondigitalservices.com/contact"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HelpCircle size={20} className="text-gray-500" />
              {!isCollapsed && <span>Support</span>}
            </a>

            <button
              onClick={handleLogout}
              className={cn(
                sidebarStyles.logoutButton.base,
                isCollapsed && sidebarStyles.logoutButton.collapsed
              )}
            >
              <LogOut size={20} className="text-gray-500" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Floating Mobile Toggle Button */}
      <motion.button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className={cn(
          sidebarStyles.mobileToggleButton?.base || 
          "md:hidden fixed bottom-4 right-4 p-3 bg-teal-600 text-white rounded-full shadow-lg z-50"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Mobile Sidebar Overlay & Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={sidebarStyles.mobileOverlay || "fixed inset-0 z-50 md:hidden"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={sidebarStyles.mobileBackdrop || "fixed inset-0 bg-black/50"}
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            <motion.div
              ref={sidebarRef}
              className={sidebarStyles.mobileSidebar?.base || "relative z-10 w-64 bg-white h-full p-4 flex flex-col justify-between shadow-xl"}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="relative h-full flex flex-col justify-between">
                <div>
                  {/* Mobile Header (Fixed Layout: [M] Hexa [v] [X] on top, email below) */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      width: '100%',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Top Row: Avatar, Username, Dropdown, Close Button */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {initial}
                          </div>
                          <span style={{ position: 'absolute', bottom: 0, right: 0 }} className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm truncate" style={{ maxWidth: '100%' }}>
                          {username}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                        <button 
                          onClick={() => setMobileOpen(false)} 
                          className={sidebarStyles.mobileCloseButton || "p-1 rounded-lg hover:bg-gray-100"}
                        >
                          <X size={20} className="text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Email Address */}
                    <div style={{ paddingLeft: '52px', marginTop: '2px' }}>
                      <span className="text-xs text-gray-500 truncate" style={{ display: 'block', width: '100%' }}>
                        {email}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Nav Links */}
                  <div className="flex-1 overflow-y-auto py-4">
                    <ul className={sidebarStyles.mobileMenuList || "space-y-2"}>
                      {MENU_ITEMS.map(({ text, path, icon }) => (
                        <motion.li key={text} whileTap={{ scale: 0.98 }}>
                          <Link
                            to={path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              sidebarStyles.mobileMenuItem?.base || sidebarStyles.menuItem.base,
                              pathname === path 
                                ? (sidebarStyles.mobileMenuItem?.active || sidebarStyles.menuItem.active)
                                : (sidebarStyles.mobileMenuItem?.inactive || sidebarStyles.menuItem.inactive)
                            )}
                          >
                            <span className={pathname === path ? sidebarStyles.menuIcon.active : sidebarStyles.menuIcon.inactive}>
                              {icon}
                            </span>
                            <span>{text}</span>
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Mobile Footer */}
                <div className={sidebarStyles.mobileFooter || "pt-4 border-t border-gray-100 space-y-2"}>
                  <a 
                    onClick={() => setMobileOpen(false)}
                    href="https://hexagondigitalservices.com/contact" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={sidebarStyles.mobileFooterLink || "flex items-center gap-3 p-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"}
                  >
                    <HelpCircle size={20} className="text-gray-500" />
                    <span>Support</span>
                  </a>
                  <button 
                    onClick={handleLogout} 
                    className={sidebarStyles.mobileLogoutButton || "flex items-center gap-3 w-full p-2 rounded-lg text-red-600 hover:bg-red-50 text-sm"}
                  >
                    <LogOut size={20} className="text-gray-500 hover:text-red-600" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;