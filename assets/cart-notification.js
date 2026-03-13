class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);

    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  open() {
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener(
      'transitionend',
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    this.notification.classList.remove('active');
    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = document.getElementById(section.id);
      const sectionHTML = parsedState.sections?.[section.id];

      if (!sectionElement || !sectionHTML) return;

      const sectionInnerHTML = this.getSectionInnerHTML(sectionHTML, section.selector, section.id);
      if (sectionInnerHTML === null) return;

      sectionElement.innerHTML = sectionInnerHTML;
    });

    this.refreshCartIconBubble();

    if (this.header) this.header.reveal();
    this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section', sectionId = '') {
    const document = new DOMParser().parseFromString(html, 'text/html');
    let element = document.querySelector(selector);

    if (!element && sectionId === 'cart-notification-product') {
      element = document.querySelector('[id^="cart-notification-product-"]');
    }

    return element ? element.innerHTML : null;
  }

  refreshCartIconBubble() {
    const cartIconBubble = document.getElementById('cart-icon-bubble');
    if (!cartIconBubble) return;

    fetch(`${routes.cart_url}?section_id=cart-icon-bubble`)
      .then((response) => response.text())
      .then((responseText) => {
        const section = new DOMParser().parseFromString(responseText, 'text/html').querySelector('.shopify-section');
        if (!section) return;

        cartIconBubble.innerHTML = section.innerHTML;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
