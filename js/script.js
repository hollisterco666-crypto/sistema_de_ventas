// Credenciales válidas para el sistema
const CREDENCIALES = {
    usuario: "admin",
    correo: "admin@ventas.com",
    password: "123456"
};

// Datos iniciales por defecto
const DATOS_INICIALES = {
    productos: [
        { id: 1, nombre: "Laptop Lenovo ThinkPad", precio: 5400, stock: 8 },
        { id: 2, nombre: "Mouse Inalámbrico Logitech", precio: 150, stock: 20 },
        { id: 3, nombre: "Monitor 24 Pulgadas IPS", precio: 1250, stock: 4 }
    ],
    clientes: [
        { ci: "7845120", nombre: "Carlos Mendoza", telefono: "71548920" },
        { ci: "9123456", nombre: "Ana Quispe", telefono: "68941230" }
    ],
    ventas: [
        { id: 1, fecha: "25/11/2026", cliente: "Carlos Mendoza", producto: "Mouse Inalámbrico Logitech", cantidad: 2, total: 300 }
    ]
};

// Funciones auxiliares de almacenamiento
const obtenerDatos = (clave) => {
    const guardado = localStorage.getItem(clave);
    if (guardado) return JSON.parse(guardado);
    localStorage.setItem(clave, JSON.stringify(DATOS_INICIALES[clave]));
    return DATOS_INICIALES[clave];
};

const guardarDatos = (clave, datos) => {
    localStorage.setItem(clave, JSON.stringify(datos));
};

document.addEventListener("DOMContentLoaded", () => {
    const enSubcarpeta = window.location.pathname.includes("/pages/");
    const formLogin = document.getElementById("form-login");

    // 1. LÓGICA DE LOGIN (index.html)
    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();
            const usuario = document.getElementById("usuario").value.trim();
            const password = document.getElementById("password").value.trim();
            const errorBox = document.getElementById("mensaje-error");

            if (!usuario || !password) {
                errorBox.textContent = "Por favor, complete todos los campos obligatorios.";
                errorBox.className = "error-visible";
                return;
            }

            const usuarioValido = (usuario === CREDENCIALES.usuario || usuario === CREDENCIALES.correo);
            if (usuarioValido && password === CREDENCIALES.password) {
                localStorage.setItem("sesionActiva", usuario);
                window.location.href = "pages/inicio.html";
            } else {
                errorBox.textContent = "Usuario/correo o contraseña incorrectos.";
                errorBox.className = "error-visible";
            }
        });
        return;
    }

    // 2. PROTECCIÓN DE RUTAS INTERNAS
    const sesion = localStorage.getItem("sesionActiva");
    if (enSubcarpeta && !sesion) {
        window.location.href = "../index.html";
        return;
    }

    const btnSalir = document.getElementById("btn-salir");
    if (btnSalir) {
        btnSalir.addEventListener("click", () => {
            localStorage.removeItem("sesionActiva");
            window.location.href = "../index.html";
        });
    }

    // 3. MÓDULO DE VENTAS (inicio.html)
    const formVenta = document.getElementById("form-venta");
    if (formVenta) {
        const renderVentas = () => {
            const ventas = obtenerDatos("ventas");
            const productos = obtenerDatos("productos");
            const clientes = obtenerDatos("clientes");

            document.getElementById("venta-cliente").innerHTML = clientes
                .map(c => `<option value="${c.nombre}">${c.nombre} (${c.ci})</option>`).join("");

            document.getElementById("venta-producto").innerHTML = productos
                .map(p => `<option value="${p.id}">${p.nombre} - Bs. ${p.precio} (Stock: ${p.stock})</option>`).join("");

            document.getElementById("tabla-ventas").innerHTML = ventas.map(v => `
                <tr>
                    <td>${v.id}</td>
                    <td>${v.fecha}</td>
                    <td>${v.cliente}</td>
                    <td>${v.producto}</td>
                    <td>${v.cantidad}</td>
                    <td><strong>Bs. ${v.total.toFixed(2)}</strong></td>
                </tr>
            `).join("");

            const totalIngresos = ventas.reduce((acc, v) => acc + v.total, 0);
            document.getElementById("kpi-ventas").textContent = ventas.length;
            document.getElementById("kpi-ingresos").textContent = `Bs. ${totalIngresos.toFixed(2)}`;
            document.getElementById("kpi-productos").textContent = productos.length;
        };

        formVenta.addEventListener("submit", (e) => {
            e.preventDefault();
            const productos = obtenerDatos("productos");
            const ventas = obtenerDatos("ventas");
            const alerta = document.getElementById("alerta-venta");

            const cliente = document.getElementById("venta-cliente").value;
            const prodId = Number(document.getElementById("venta-producto").value);
            const cantidad = Number(document.getElementById("venta-cantidad").value);
            const producto = productos.find(p => p.id === prodId);

            if (!producto || cantidad <= 0 || cantidad > producto.stock) {
                alerta.textContent = "Stock insuficiente o cantidad inválida.";
                alerta.className = "error-visible";
                return;
            }

            alerta.className = "error-oculto";
            producto.stock -= cantidad;
            ventas.push({
                id: ventas.length + 1,
                fecha: new Date().toLocaleDateString("es-BO"),
                cliente,
                producto: producto.nombre,
                cantidad,
                total: producto.precio * cantidad
            });

            guardarDatos("productos", productos);
            guardarDatos("ventas", ventas);
            formVenta.reset();
            renderVentas();
        });

        renderVentas();
    }

    // 4. MÓDULO DE PRODUCTOS (productos.html)
    const formProducto = document.getElementById("form-producto");
    if (formProducto) {
        const renderProductos = () => {
            const productos = obtenerDatos("productos");
            document.getElementById("tabla-productos").innerHTML = productos.map((p, idx) => `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.nombre}</td>
                    <td>Bs. ${Number(p.precio).toFixed(2)}</td>
                    <td class="${p.stock <= 5 ? 'stock-bajo' : ''}">${p.stock}</td>
                    <td><button class="btn-eliminar" onclick="eliminarItem('productos', ${idx})">Eliminar</button></td>
                </tr>
            `).join("");

            const bajoStock = productos.filter(p => p.stock <= 5).length;
            document.getElementById("kpi-stock-bajo").textContent = bajoStock;
        };

        formProducto.addEventListener("submit", (e) => {
            e.preventDefault();
            const productos = obtenerDatos("productos");
            productos.push({
                id: productos.length ? productos[productos.length - 1].id + 1 : 1,
                nombre: document.getElementById("prod-nombre").value.trim(),
                precio: parseFloat(document.getElementById("prod-precio").value),
                stock: parseInt(document.getElementById("prod-stock").value)
            });
            guardarDatos("productos", productos);
            formProducto.reset();
            renderProductos();
        });

        renderProductos();
    }

    // 5. MÓDULO DE CLIENTES (clientes.html)
    const formCliente = document.getElementById("form-cliente");
    if (formCliente) {
        const renderClientes = () => {
            const clientes = obtenerDatos("clientes");
            document.getElementById("tabla-clientes").innerHTML = clientes.map((c, idx) => `
                <tr>
                    <td>${c.ci}</td>
                    <td>${c.nombre}</td>
                    <td>${c.telefono}</td>
                    <td><button class="btn-eliminar" onclick="eliminarItem('clientes', ${idx})">Eliminar</button></td>
                </tr>
            `).join("");
            document.getElementById("kpi-clientes").textContent = clientes.length;
        };

        formCliente.addEventListener("submit", (e) => {
            e.preventDefault();
            const clientes = obtenerDatos("clientes");
            clientes.push({
                ci: document.getElementById("cli-ci").value.trim(),
                nombre: document.getElementById("cli-nombre").value.trim(),
                telefono: document.getElementById("cli-telefono").value.trim()
            });
            guardarDatos("clientes", clientes);
            formCliente.reset();
            renderClientes();
        });

        renderClientes();
    }
});

// Función global para eliminar registros
function eliminarItem(clave, indice) {
    const lista = obtenerDatos(clave);
    lista.splice(indice, 1);
    guardarDatos(clave, lista);
    location.reload();
}