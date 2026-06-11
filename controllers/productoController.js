// Aquí vamos a manejar todo lo relacionado con los productos, como crear un nuevo producto, 
// mostrar los productos, actualizar o eliminar un producto

const Producto = require("../models/Producto");
const Marca = require("../models/Marca");

// Función para agregar un producto nuevo
exports.crearProducto = async (req, res) => {
  try {
    const marcaLogueada = await Marca.findById(req.usuario.id); // 👈 Marca, no Usuario

    if (!marcaLogueada) {
      return res.status(404).json({ msg: 'No se encontró tu marca bro' });
    }

    const datosProducto = { ...req.body };

    // Ahora atrapamos múltiples fotos
    if (req.files && req.files.length > 0) {
      datosProducto.imagenes = req.files.map(file => file.path); // 👈 array de URLs
    }

    datosProducto.marcaNombre = marcaLogueada.nombreMarca;
    datosProducto.marcaId = marcaLogueada._id;

    let producto = new Producto(datosProducto);
    await producto.save();

    res.status(201).json(producto);
  } catch (error) {
    console.log('Error al crear producto:', error);
    res.status(500).json({ msg: 'Hubo un error en el servidor al subir la prenda' });
  }
  if (req.body.tallas) {
    try {
      datosProducto.tallas = JSON.parse(req.body.tallas);
    } catch (e) {
      datosProducto.tallas = req.body.tallas; // por si acaso
    }
  }
};

// Función para obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const { estilo, marca, fit, buscar } = req.query;
    let filtro = {};

    // Le agregamos la Expresión Regular con la opción 'i' a cada uno
    if (estilo) {
      filtro.estilo = new RegExp(estilo, "i");
    }
    if (marca) {
      filtro.marca = new RegExp(marca, "i");
    }
    if (fit) {
      filtro.fit = new RegExp(fit, "i");
    }
    // El filtro de la lupa
    if (buscar) {
      // Busca cualquier producto cuyo NOMBRE contenga lo que el usuario escribió
      filtro.nombre = new RegExp(buscar, "i");
    }
    // Buscamos en la base de datos usando el filtro que armamos
    const productos = await Producto.find(filtro);
    res.json(productos);
  } catch (error) {
    console.log("Error al filtrar productos:", error);
    res.status(500).send("Hubo un error al buscar la ropa bro");
  }
};

// Función para actualizar un producto
exports.actualizarProducto = async (req, res) => {
  try {
    let producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ msg: 'No existe el producto bro' });
    }

    const actualizaciones = { ...req.body };

    // Convertimos las tallas de string JSON a array de objetos
    if (req.body.tallas && typeof req.body.tallas === 'string') {
      try {
        actualizaciones.tallas = JSON.parse(req.body.tallas);
      } catch (e) {
        // Si falla el JSON, intentamos el formato viejo "S,M,L"
        actualizaciones.tallas = req.body.tallas.split(',')
          .filter(t => t.trim() !== '')
          .map(t => ({ talla: t.trim(), stock: 1 }));
      }
    }

    // Si mandaron imágenes nuevas las actualizamos
    if (req.files && req.files.length > 0) {
      actualizaciones.imagenes = req.files.map(file => file.path);
    }

    producto = await Producto.findByIdAndUpdate(
      req.params.id,
      actualizaciones,
      { new: true }
    );

    res.json(producto);
  } catch (error) {
    console.log('Error al actualizar producto:', error);
    res.status(500).send('Hubo un error al actualizar la mercadería bro');
  }
};

// Función para eliminar un producto
exports.eliminarProducto = async (req, res) => {
  try {
    // Igual que antes, buscamos si existe
    let producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ msg: "No existe el producto bro" });
    }

    // Si existe, lo mandamos a volar de la base de datos
    await Producto.findByIdAndDelete(req.params.id);

    res.json({ msg: "¡Producto eliminado con éxito!" });
  } catch (error) {
    console.log("Error al eliminar producto:", error);
    res.status(500).send("Hubo un error al borrar el producto bro");
  }
};

// Función para enviarle al frontend una lista limpia de las marcas que existen
exports.obtenerMarcas = async (req, res) => {
  try {
    // Busca en tooooodos los productos y saca solo los nombres de las marcas sin repetir
    const marcas = await Producto.distinct('marca');

    // Devuelve un arreglo limpiecito: ["Ecuador Street Cult", "Nike", "Adidas"]
    res.json(marcas);

  } catch (error) {
    console.log('Error al obtener las marcas:', error);
    res.status(500).send('Hubo un error al buscar las marcas bro');
  }
}

// Función para obtener solo los productos del usuario que está logueado
exports.obtenerMisProductos = async (req, res) => {
  try {
    const productos = await Producto.find({ marcaId: req.usuario.id });
    res.json(productos);
  } catch (error) {
    console.log('Error:', error);
    res.status(500).send('Error al obtener tus productos bro');
  }
};
// esto se hace para que los del frontend puedan usar estas funciones 
// cuando hagan peticiones a las rutas que definimos en productoRoutes.js