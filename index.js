const client = contentful.createClient({
    // this is the space ID. A space is like a project folder in a Contentful terms
    space: '06582iena0d1',
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: 'oN2q8khGpKtQ8ZqvIR-vRJ_-NmglWcIYIHa_1lJI6eM'
})


// grabing classnames from the document 
const cartBtn = document.querySelector('.cart-btn')
const closeCartBtn = document.querySelector('.close-cart')
const clearCartBtn = document.querySelector('.clear-cart')
const cartDom = document.querySelector('.cart')
const cartOverlay = document.querySelector('.cart-overlay')
const cartItems = document.querySelector('.cart-items')
const cartTotal = document.querySelector('.cart-total')
const cartContent = document.querySelector('.cart-content')
const productDom = document.querySelector('.products-center')

// cart
let cart = []
// butttons
let btnsDOM = []

// getting the products
class Products{
    async getProducts(){
        try{

            let contentful = await client.getEntries({
                content_type: 'comfyHouse'
            })
            

            // let result = await fetch('products.json')
            // let data = await result.json();

            let products = contentful.items;
            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title, price, id, image}
            })
            return products;
        } catch (error) {
            console.log(error);
        }
        
    }
}
// display the products
class UI {
    displayProducts(products){
       let result = ''
       products.forEach(product => {
        result +=`
        <article class="product">
        <div class="img-container">
            <img src=${product.image} alt="product" class="product-img">
            <button class="bag-btn" data-id=${product.id}>
                <i class="uil uil-shopping-cart"></i>
                add to bag
            </button>
        </div>
        <h3>${product.title}</h3>
        <h4>$${product.price}</h4>
    </article>
        `;
       })
       productDom.innerHTML = result;
    }
    // grabing the bag buttons from the document.
    // we can't grab the baf butons upward that would mean we are grabing the btns before the document loads
    getBagButtons(){
        // selevting the btns using the SPREAD OPERATOR
        const btns = [...document.querySelectorAll('.bag-btn')]
        btnsDOM = btns;
        btns.forEach(btn => {
            let id = btn.dataset.id
            // checking if the item is on cart
            let inCart = cart.find(item => item.id === id);
            if(inCart){
                btn.innerText = 'In Cart';
                // changing the inner text if item is in cart
                // disabling item if it is cart
                btn.disabled = true
            }
            btn.addEventListener('click', () => {
                event.target.innerText = 'In Cart';
                event.target.disabled = true;
                // get product from products
                let cartItem = {...Storage.getProduct(id), amount:1}
                // add product to the cart 
                cart = [...cart, cartItem]
                // save the cart in the local storage
                Storage.saveCart(cart)
                // set cart values
                this.setCartValues(cart);
                // display cart item
                this.addCartItem(cartItem)
                // show the cart
                this.showCart()
            })
        })
    }
    // calculating the total no of items in cart and total amount of items in cart
    setCartValues(cart){
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }
    addCartItem(item){
        const div = document.createElement('div')
        div.classList.add('cart-item')
        div.innerHTML = `
        <img src=${item.image} alt="product">
        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="uil uil-angle-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="uil uil-angle-down" data-id=${item.id}></i>
        </div>
        `
        cartContent.appendChild(div);
    }
    showCart(){
        cartOverlay.classList.add('transparentBcg')
        cartDom.classList.add('showCart')
    }
    setupApp(){
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener('click', this.showCart)
        closeCartBtn.addEventListener('click', this.hideCart)
    }
    populateCart(cart){
        cart.forEach(item => {
            this.addCartItem(item);
        })
    }
    hideCart(){
        cartOverlay.classList.remove('transparentBcg')
        cartDom.classList.remove('showCart')
    }
    cartLogic(){
        // clear cart btn
        clearCartBtn.addEventListener('click', ()=>{
            this.clearCart()
        })
        // cart functionality
        cartContent.addEventListener('click', event => {
            if(event.target.classList.contains('remove-item')){
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItems(id)
            } else if(event.target.classList.contains('uil-angle-up')){
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart)
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if(event.target.classList.contains('uil-angle-down')) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                if(tempItem.amount > 0){
                    Storage.saveCart(cart);
                    this.setCartValues(cart)
                    lowerAmount.previousElementSibling.innerText = tempItem.amount
                } else{
                    cartContent.removeChild(lowerAmount.parentElement);
                    this.removeItems(id)
                }
            }
        })
    }
    clearCart(){
        let cartItems = cart.map(item => item.id)
        cartItems.forEach(id => this.removeItems(id))
        while(cartContent.children.length > 0){
            cartContent.removeChild(cartContent.children[0])
        }
        this.hideCart();
    }
    removeItems(id){
        cart = cart.filter(item => item.id !== id)
        this.setCartValues(cart);
        Storage.saveCart(cart)
        let btn = this.getSingleBtn(id);
        btn.disabled = false
        btn.innerHTML = `<i class="uil uil-shopping-cart"></i>add to cart`
    }
    getSingleBtn(id){
        return btnsDOM.find(btn => btn.dataset.id === id)
    }
}

// local storage
class Storage{
    static saveProducts(products){
        localStorage.setItem('products', JSON.stringify(products))
    }
    static getProduct(id){
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id)
    }
    static saveCart(cart){
        localStorage.setItem('cart', JSON.stringify(cart))
    }

    static getCart(){
        return localStorage.getItem('cart')? JSON.parse(localStorage.getItem('cart')):[]
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI()
    const products = new Products()
    // setup Application
    ui.setupApp();
    // get all products
    products.getProducts().then(products => 
        {ui.displayProducts(products)
        Storage.saveProducts(products)
    }).then(()=>{
        ui.getBagButtons();
        ui.cartLogic();
    });
    
})