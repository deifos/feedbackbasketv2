/**
 * Feedback Widget - Embeddable feedback collection widget
 * Version: 1.0.0
 *
 * Usage:
 * <script>
 *   window.FeedbackWidget.init({
 *     projectId: 'your-project-id',
 *     apiEndpoint: 'https://yourapp.com/api/widget/feedback',
 *     buttonColor: '#3b82f6',
 *     buttonRadius: 8,
 *     buttonLabel: 'Feedback',
 *     successMessage: 'Thank you for your feedback!'
 *   });
 * </script>
 */

(function (window, document) {
  'use strict';

  // Prevent multiple initializations
  if (window.FeedbackWidget) {
    return;
  }

  // Widget namespace
  window.FeedbackWidget = {
    config: null,
    elements: {},
    isInitialized: false,

    // Initialize the widget
    init: function (config) {
      if (this.isInitialized) {
        console.warn('FeedbackWidget: Already initialized');
        return;
      }

      // Validate required config
      if (!config || !config.projectId || !config.apiEndpoint) {
        console.error('FeedbackWidget: Missing required configuration (projectId, apiEndpoint)');
        return;
      }

      // Set default configuration
      this.config = {
        projectId: config.projectId,
        apiEndpoint: config.apiEndpoint,
        buttonColor: config.buttonColor || '#3b82f6',
        buttonRadius: config.buttonRadius || 8,
        buttonLabel: config.buttonLabel || 'Feedback',
        introMessage:
          config.introMessage || "We'd love to hear your thoughts! Your feedback helps us improve.",
        successMessage: config.successMessage || 'Thank you for your feedback!',
        position: config.position || 'bottom-right', // bottom-right, bottom-left, top-right, top-left
        zIndex: config.zIndex || 9999,
      };

      this.createWidget();
      this.isInitialized = true;
    },

    // Create the widget elements
    createWidget: function () {
      // Check if widget already exists
      if (document.getElementById('feedback-widget-container')) {
        return;
      }

      this.createButton();
      this.createModal();
      this.addToPage();
      this.attachEventListeners();
    },

    // Create the feedback button
    createButton: function () {
      const button = document.createElement('button');
      button.id = 'feedback-widget-button';
      button.setAttribute('aria-label', 'Open feedback form');
      button.innerHTML = this.getButtonHTML();

      // Apply button styles
      this.applyButtonStyles(button);

      this.elements.button = button;
    },

    // Get button HTML with icon
    getButtonHTML: function () {
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${this.config.buttonLabel}</span>
      `;
    },

    // Apply styles to the button
    applyButtonStyles: function (button) {
      const position = this.getPositionStyles();

      button.style.cssText = `
        position: fixed;
        ${position}
        background-color: ${this.config.buttonColor};
        color: white;
        border: none;
        border-radius: ${this.config.buttonRadius}px;
        padding: 12px 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: ${this.config.zIndex};
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        text-decoration: none;
        outline: none;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      `;

      // Add hover effects
      button.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
      });

      button.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      });

      // Add focus styles for accessibility
      button.addEventListener('focus', function () {
        this.style.outline = '2px solid rgba(59, 130, 246, 0.5)';
        this.style.outlineOffset = '2px';
      });

      button.addEventListener('blur', function () {
        this.style.outline = 'none';
      });
    },

    // Get position styles based on config
    getPositionStyles: function () {
      const positions = {
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;',
        'top-right': 'top: 20px; right: 20px;',
        'top-left': 'top: 20px; left: 20px;',
      };

      return positions[this.config.position] || positions['bottom-right'];
    },

    // Create the modal
    createModal: function () {
      const modal = document.createElement('div');
      modal.id = 'feedback-widget-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'feedback-modal-title');

      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: ${this.config.zIndex + 1};
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      `;

      // Create form container
      const formContainer = document.createElement('div');
      formContainer.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 0;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
      `;

      formContainer.innerHTML = this.getModalHTML();
      modal.appendChild(formContainer);

      this.elements.modal = modal;
      this.elements.formContainer = formContainer;
    },

    // Get modal HTML
    getModalHTML: function () {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 0 24px; margin-bottom: 20px;">
          <h3 id="feedback-modal-title" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 600; color: #1f2937;">Send Feedback</h3>
          <button id="feedback-close-btn" type="button" aria-label="Close feedback form" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">&times;</button>
        </div>
        <form id="feedback-form" style="padding: 0 24px 24px 24px;">
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #6b7280; line-height: 1.5;">${this.config.introMessage || "We'd love to hear your thoughts! Your feedback helps us improve."}</p>
          </div>
          <div style="margin-bottom: 16px;">
            <label for="feedback-email" style="display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #374151;">Email (optional)</label>
            <input type="email" id="feedback-email" placeholder="your@email.com" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
          </div>
          <div style="margin-bottom: 20px;">
            <label for="feedback-content" style="display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #374151;">Your feedback *</label>
            <textarea id="feedback-content" required placeholder="Tell us what you think..." style="width: 100%; height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; resize: vertical; box-sizing: border-box; outline: none; transition: border-color 0.2s ease;" rows="4"></textarea>
          </div>
          <div style="display: flex; gap: 12px;">
            <button type="submit" id="feedback-submit-btn" style="flex: 1; background-color: ${this.config.buttonColor}; color: white; border: none; border-radius: 6px; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease;">Send Feedback</button>
            <button type="button" id="feedback-cancel-btn" style="flex: 1; background-color: #f3f4f6; color: #374151; border: none; border-radius: 6px; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segue UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease;">Cancel</button>
          </div>
        </form>
        <div id="feedback-success" style="display: none; text-align: center; padding: 24px;">
          <div style="width: 48px; height: 48px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #1f2937;">${this.config.successMessage}</p>
        </div>
      `;
    },

    // Attach event listeners
    attachEventListeners: function () {
      const self = this;

      // Button click to open modal
      this.elements.button.addEventListener('click', function () {
        self.openModal();
      });

      // Close modal events
      document.getElementById('feedback-close-btn').addEventListener('click', function () {
        self.closeModal();
      });

      document.getElementById('feedback-cancel-btn').addEventListener('click', function () {
        self.closeModal();
      });

      // Click outside to close
      this.elements.modal.addEventListener('click', function (e) {
        if (e.target === self.elements.modal) {
          self.closeModal();
        }
      });

      // Escape key to close
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.elements.modal.style.display === 'flex') {
          self.closeModal();
        }
      });

      // Form submission
      document.getElementById('feedback-form').addEventListener('submit', function (e) {
        e.preventDefault();
        self.submitFeedback();
      });

      // Input focus styles
      this.addInputFocusStyles();
    },

    // Add focus styles to inputs
    addInputFocusStyles: function () {
      const inputs = ['feedback-content', 'feedback-email'];

      inputs.forEach(function (inputId) {
        const input = document.getElementById(inputId);
        if (input) {
          input.addEventListener('focus', function () {
            this.style.borderColor = '#3b82f6';
            this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          });

          input.addEventListener('blur', function () {
            this.style.borderColor = '#d1d5db';
            this.style.boxShadow = 'none';
          });
        }
      });
    },

    // Open modal
    openModal: function () {
      this.elements.modal.style.display = 'flex';

      // Focus the textarea
      const textarea = document.getElementById('feedback-content');
      if (textarea) {
        setTimeout(function () {
          textarea.focus();
        }, 100);
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    },

    // Close modal
    closeModal: function () {
      this.elements.modal.style.display = 'none';

      // Reset form
      const form = document.getElementById('feedback-form');
      if (form) {
        form.reset();
        form.style.display = 'block';
      }

      // Hide success message
      const success = document.getElementById('feedback-success');
      if (success) {
        success.style.display = 'none';
      }

      // Restore body scroll
      document.body.style.overflow = '';
    },

    // Submit feedback
    submitFeedback: function () {
      const self = this;
      const submitBtn = document.getElementById('feedback-submit-btn');
      const contentInput = document.getElementById('feedback-content');
      const emailInput = document.getElementById('feedback-email');

      // Enhanced client-side validation
      const content = contentInput.value.trim();
      const email = emailInput.value.trim();

      // Validate content
      if (!content) {
        this.showValidationError(contentInput, 'Feedback content is required');
        return;
      }

      if (content.length > 2000) {
        this.showValidationError(contentInput, 'Feedback must be less than 2000 characters');
        return;
      }

      // Validate email if provided
      if (email && !this.isValidEmail(email)) {
        this.showValidationError(emailInput, 'Please enter a valid email address');
        return;
      }

      if (email && email.length > 254) {
        this.showValidationError(emailInput, 'Email address is too long');
        return;
      }

      // Clear any existing validation errors
      this.clearValidationErrors();

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      const payload = {
        projectId: this.config.projectId,
        content: contentInput.value.trim(),
        email: emailInput.value.trim() || null,
      };

      fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to submit feedback');
        })
        .then(function (data) {
          // Show success message
          document.getElementById('feedback-form').style.display = 'none';
          document.getElementById('feedback-success').style.display = 'block';

          // Auto-close after 3 seconds
          setTimeout(function () {
            self.closeModal();
          }, 3000);
        })
        .catch(function (error) {
          console.error('Feedback submission error:', error);
          alert('Failed to submit feedback. Please try again.');
        })
        .finally(function () {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    },

    // Add widget to page
    addToPage: function () {
      const container = document.createElement('div');
      container.id = 'feedback-widget-container';
      container.appendChild(this.elements.button);
      container.appendChild(this.elements.modal);

      document.body.appendChild(container);
    },

    // Validation helper functions
    isValidEmail: function (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    showValidationError: function (input, message) {
      // Remove any existing error message
      this.clearValidationError(input);

      // Add error styling to input
      input.style.borderColor = '#ef4444';
      input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';

      // Create and show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'feedback-validation-error';
      errorDiv.style.cssText = `
        color: #ef4444;
        font-size: 12px;
        margin-top: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      errorDiv.textContent = message;

      // Insert error message after the input
      input.parentNode.insertBefore(errorDiv, input.nextSibling);

      // Focus the input
      input.focus();
    },

    clearValidationError: function (input) {
      // Reset input styling
      input.style.borderColor = '#d1d5db';
      input.style.boxShadow = 'none';

      // Remove error message
      const errorDiv = input.parentNode.querySelector('.feedback-validation-error');
      if (errorDiv) {
        errorDiv.remove();
      }
    },

    clearValidationErrors: function () {
      // Clear all validation errors
      const inputs = ['feedback-content', 'feedback-email'];
      const self = this;

      inputs.forEach(function (inputId) {
        const input = document.getElementById(inputId);
        if (input) {
          self.clearValidationError(input);
        }
      });
    },

    // Destroy widget (for cleanup)
    destroy: function () {
      const container = document.getElementById('feedback-widget-container');
      if (container) {
        container.remove();
      }

      this.elements = {};
      this.isInitialized = false;
      this.config = null;
    },
  };

  // Auto-initialize using window.__feedbackBasket configuration
  function autoInit() {
    // Check for modern configuration pattern
    if (window.__feedbackBasket) {
      const config = window.__feedbackBasket;
      if (config.projectId && config.apiEndpoint) {
        window.FeedbackWidget.init(config);
        return;
      }
    }

    // Fallback: check for data attributes on script tag
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src && script.src.includes('feedback-widget.js')) {
        const config = {
          projectId: script.getAttribute('data-project-id'),
          apiEndpoint: script.getAttribute('data-api-endpoint'),
          buttonColor: script.getAttribute('data-button-color'),
          buttonRadius: parseInt(script.getAttribute('data-button-radius')) || undefined,
          buttonLabel: script.getAttribute('data-button-label'),
          successMessage: script.getAttribute('data-success-message'),
          position: script.getAttribute('data-position'),
        };

        if (config.projectId && config.apiEndpoint) {
          window.FeedbackWidget.init(config);
        }
        break;
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})(window, document);
