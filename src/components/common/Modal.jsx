import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

/**
 * Modal minimalista y elegante
 */
let modalIdCounter = 0;

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  mobileSheet = true,
  footer = null,
}) => {
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const dragStartYRef = useRef(null);
  const dragCurrentYRef = useRef(null);
  const titleIdRef = useRef('');
  const bodyIdRef = useRef('');

  if (!titleIdRef.current) {
    modalIdCounter += 1;
    titleIdRef.current = `modal-title-${modalIdCounter}`;
    bodyIdRef.current = `modal-body-${modalIdCounter}`;
  }
  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === 'Tab' && isOpen && containerRef.current) {
        // Focus trap
        const focusable = containerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      previouslyFocusedRef.current = document.activeElement;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Foco inicial
  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Prioridad: botón cierre > primer elemento interactivo > contenedor
      const closeBtn = containerRef.current.querySelector('[data-close-btn]');
      const focusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (closeBtn) closeBtn.focus();
      else if (focusable) focusable.focus();
      else containerRef.current.focus();
    }
  }, [isOpen]);

  // Swipe to close (solo móvil + sheet)
  const handleTouchStart = useCallback((e) => {
    if (!mobileSheet) return;
    dragStartYRef.current = e.touches[0].clientY;
    dragCurrentYRef.current = dragStartYRef.current;
  }, [mobileSheet]);

  const handleTouchMove = useCallback((e) => {
    if (!mobileSheet || dragStartYRef.current == null) return;
    dragCurrentYRef.current = e.touches[0].clientY;
    const delta = dragCurrentYRef.current - dragStartYRef.current;
    if (delta > 0 && containerRef.current) {
      containerRef.current.style.transform = `translateY(${Math.min(delta, 160)}px)`;
      containerRef.current.style.opacity = `${Math.max(0.4, 1 - delta / 300)}`;
    }
  }, [mobileSheet]);

  const handleTouchEnd = useCallback(() => {
    if (!mobileSheet || dragStartYRef.current == null) return;
    const delta = (dragCurrentYRef.current || 0) - dragStartYRef.current;
    if (delta > 110) {
      onClose();
    } else if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.opacity = '';
    }
    dragStartYRef.current = null;
    dragCurrentYRef.current = null;
  }, [mobileSheet, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby={title ? titleIdRef.current : undefined}
      aria-describedby={bodyIdRef.current}
    >
      <div 
        className={`modal-container ${className}`} 
        data-size={size}
        ref={containerRef}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {mobileSheet && <div className="modal-drag-bar" />}
        {(title || showCloseButton) && (
          <div className="flex items-center gap-3 mb-5">
            {title && (
              <h2 id={titleIdRef.current} className="text-base font-semibold tracking-tight text-white flex-1">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="btn-icon ml-auto"
                aria-label="Cerrar modal"
                data-close-btn
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div id={bodyIdRef.current} className="modal-body space-y-4">
          {children}
        </div>
        {footer && (
          <div className="pt-4 mt-4 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  className: PropTypes.string,
  mobileSheet: PropTypes.bool,
  footer: PropTypes.node,
};

export default Modal;