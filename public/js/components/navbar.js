/* ================================
   Navbar Component - Auto Injection
   ================================ */

const NavbarComponent = {
    template: `
        <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
            <div class="container position-relative">
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <a class="navbar-brand" href="index.html">
                    Nigger Events
                </a>
                <div class="collapse navbar-collapse" id="navbarMain">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="index.html">Início</a>
                        </li>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Campeonatos
                            </a>
                            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                                <li><a class="dropdown-item" href="f1-championship.html">Campeonato F1</a></li>
                                <li><a class="dropdown-item" href="coco-championship.html">Campeonato de Coco</a></li>
                                <li><a class="dropdown-item" href="nofap-championship.html">NoFap September</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `,

    render() {
        // Create navbar element
        const navbarContainer = document.createElement('div');
        navbarContainer.innerHTML = this.template;
        
        // Insert at the beginning of body
        document.body.insertBefore(navbarContainer.firstElementChild, document.body.firstChild);
    }
};

// Auto-inject navbar when DOM is ready - IMMEDIATE
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NavbarComponent.render());
} else {
    NavbarComponent.render();
}
