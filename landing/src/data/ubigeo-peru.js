/**
 * Dataset de ubigeos del Perú para el checkout.
 *
 * Estructura: { [DEPARTMENT_CODE]: { label, provinces: { [provLabel]: [districts] } } }
 *
 * Cobertura actual:
 *   - LIMA y CALLAO: TODOS los distritos (donde se concentra ~70% del comercio)
 *   - Resto del Perú: 196 provincias del país con su capital como distrito por defecto
 *
 * Para agregar más distritos a otras provincias, basta con extender el array
 * correspondiente.
 *
 * Códigos de departamento alineados con backend/src/config/constants.ts
 */

export const UBIGEO_PERU = {
  LIMA: {
    label: 'Lima',
    provinces: {
      'Lima': [
        'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos',
        'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María',
        'La Molina', 'La Victoria', 'Lima (Cercado)', 'Lince', 'Los Olivos',
        'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar', 'Miraflores',
        'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
        'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro',
        'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
        'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
        'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
        'Villa María del Triunfo',
      ],
      'Barranca': ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'],
      'Cajatambo': ['Cajatambo', 'Copa', 'Gorgor', 'Huancapón', 'Manás'],
      'Canta': ['Canta', 'Arahuay', 'Huamantanga', 'Huaros', 'Lachaqui', 'San Buenaventura', 'Santa Rosa de Quives'],
      'Cañete': ['San Vicente de Cañete', 'Asia', 'Calango', 'Cerro Azul', 'Chilca', 'Coayllo', 'Imperial', 'Lunahuaná', 'Mala', 'Nuevo Imperial', 'Pacarán', 'Quilmaná', 'San Antonio', 'San Luis', 'Santa Cruz de Flores', 'Zúñiga'],
      'Huaral': ['Huaral', 'Atavillos Alto', 'Atavillos Bajo', 'Aucallama', 'Chancay', 'Ihuari', 'Lampián', 'Pacaraos', 'San Miguel de Acos', 'Santa Cruz de Andamarca', 'Sumbilca', 'Veintisiete de Noviembre'],
      'Huarochirí': ['Matucana', 'Antioquía', 'Callahuanca', 'Carampoma', 'Chicla', 'Cuenca', 'Huachupampa', 'Huanza', 'Huarochirí', 'Lahuaytambo', 'Langa', 'Laraos', 'Mariatana', 'Ricardo Palma', 'San Andrés de Tupicocha', 'San Antonio', 'San Bartolomé', 'San Damián', 'San Juan de Iris', 'San Juan de Tantaranche', 'San Lorenzo de Quinti', 'San Mateo', 'San Mateo de Otao', 'San Pedro de Casta', 'San Pedro de Huancayre', 'Sangallaya', 'Santa Cruz de Cocachacra', 'Santa Eulalia', 'Santiago de Anchucaya', 'Santiago de Tuna', 'Santo Domingo de los Olleros', 'Surco'],
      'Huaura': ['Huacho', 'Ámbar', 'Caleta de Carquín', 'Checras', 'Hualmay', 'Huaura', 'Leoncio Prado', 'Paccho', 'Santa Leonor', 'Santa María', 'Sayán', 'Végueta'],
      'Oyón': ['Oyón', 'Andajes', 'Caujul', 'Cochamarca', 'Naván', 'Pachangara'],
      'Yauyos': ['Yauyos', 'Alis', 'Allauca', 'Ayauca', 'Ayaviri', 'Azángaro', 'Cacra', 'Carania', 'Catahuasi', 'Chocos', 'Cochas', 'Colonia', 'Hongos', 'Huampara', 'Huancaya', 'Huangáscar', 'Huantán', 'Huañec', 'Laraos', 'Lincha', 'Madean', 'Miraflores', 'Omas', 'Putinza', 'Quinches', 'Quinocay', 'San Joaquín', 'San Pedro de Pilas', 'Tanta', 'Tauripampa', 'Tomás', 'Tupe', 'Viñac', 'Vitis'],
    },
  },
  CALLAO: {
    label: 'Callao',
    provinces: {
      'Callao': ['Callao', 'Bellavista', 'Carmen de la Legua-Reynoso', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla'],
    },
  },
  AMAZONAS: {
    label: 'Amazonas',
    provinces: {
      'Chachapoyas': ['Chachapoyas'],
      'Bagua': ['Bagua'],
      'Bongará': ['Jumbilla'],
      'Condorcanqui': ['Nieva'],
      'Luya': ['Lámud'],
      'Rodríguez de Mendoza': ['San Nicolás'],
      'Utcubamba': ['Bagua Grande'],
    },
  },
  ANCASH: {
    label: 'Áncash',
    provinces: {
      'Huaraz': ['Huaraz', 'Independencia'],
      'Aija': ['Aija'],
      'Antonio Raimondi': ['Llamellín'],
      'Asunción': ['Chacas'],
      'Bolognesi': ['Chiquián'],
      'Carhuaz': ['Carhuaz'],
      'Carlos Fermín Fitzcarrald': ['San Luis'],
      'Casma': ['Casma'],
      'Corongo': ['Corongo'],
      'Huari': ['Huari'],
      'Huarmey': ['Huarmey'],
      'Huaylas': ['Caraz'],
      'Mariscal Luzuriaga': ['Piscobamba'],
      'Ocros': ['Ocros'],
      'Pallasca': ['Cabana'],
      'Pomabamba': ['Pomabamba'],
      'Recuay': ['Recuay'],
      'Santa': ['Chimbote', 'Nuevo Chimbote', 'Coishco', 'Santa'],
      'Sihuas': ['Sihuas'],
      'Yungay': ['Yungay'],
    },
  },
  APURIMAC: {
    label: 'Apurímac',
    provinces: {
      'Abancay': ['Abancay'],
      'Andahuaylas': ['Andahuaylas'],
      'Antabamba': ['Antabamba'],
      'Aymaraes': ['Chalhuanca'],
      'Cotabambas': ['Tambobamba'],
      'Chincheros': ['Chincheros'],
      'Grau': ['Chuquibambilla'],
    },
  },
  AREQUIPA: {
    label: 'Arequipa',
    provinces: {
      'Arequipa': ['Arequipa', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandía', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura', 'José Luis Bustamante y Rivero'],
      'Camaná': ['Camaná'],
      'Caravelí': ['Caravelí'],
      'Castilla': ['Aplao'],
      'Caylloma': ['Chivay'],
      'Condesuyos': ['Chuquibamba'],
      'Islay': ['Mollendo'],
      'La Unión': ['Cotahuasi'],
    },
  },
  AYACUCHO: {
    label: 'Ayacucho',
    provinces: {
      'Huamanga': ['Ayacucho'],
      'Cangallo': ['Cangallo'],
      'Huanca Sancos': ['Sancos'],
      'Huanta': ['Huanta'],
      'La Mar': ['San Miguel'],
      'Lucanas': ['Puquio'],
      'Parinacochas': ['Coracora'],
      'Páucar del Sara Sara': ['Pausa'],
      'Sucre': ['Querobamba'],
      'Víctor Fajardo': ['Huancapi'],
      'Vilcas Huamán': ['Vilcas Huamán'],
    },
  },
  CAJAMARCA: {
    label: 'Cajamarca',
    provinces: {
      'Cajamarca': ['Cajamarca'],
      'Cajabamba': ['Cajabamba'],
      'Celendín': ['Celendín'],
      'Chota': ['Chota'],
      'Contumazá': ['Contumazá'],
      'Cutervo': ['Cutervo'],
      'Hualgayoc': ['Bambamarca'],
      'Jaén': ['Jaén'],
      'San Ignacio': ['San Ignacio'],
      'San Marcos': ['Pedro Gálvez'],
      'San Miguel': ['San Miguel'],
      'San Pablo': ['San Pablo'],
      'Santa Cruz': ['Santa Cruz'],
    },
  },
  CUSCO: {
    label: 'Cusco',
    provinces: {
      'Cusco': ['Cusco', 'San Sebastián', 'San Jerónimo', 'Santiago', 'Wanchaq'],
      'Acomayo': ['Acomayo'],
      'Anta': ['Anta'],
      'Calca': ['Calca'],
      'Canas': ['Yanaoca'],
      'Canchis': ['Sicuani'],
      'Chumbivilcas': ['Santo Tomás'],
      'Espinar': ['Espinar'],
      'La Convención': ['Quillabamba'],
      'Paruro': ['Paruro'],
      'Paucartambo': ['Paucartambo'],
      'Quispicanchi': ['Urcos'],
      'Urubamba': ['Urubamba'],
    },
  },
  HUANCAVELICA: {
    label: 'Huancavelica',
    provinces: {
      'Huancavelica': ['Huancavelica'],
      'Acobamba': ['Acobamba'],
      'Angaraes': ['Lircay'],
      'Castrovirreyna': ['Castrovirreyna'],
      'Churcampa': ['Churcampa'],
      'Huaytará': ['Huaytará'],
      'Tayacaja': ['Pampas'],
    },
  },
  HUANUCO: {
    label: 'Huánuco',
    provinces: {
      'Huánuco': ['Huánuco', 'Amarilis', 'Pillco Marca'],
      'Ambo': ['Ambo'],
      'Dos de Mayo': ['La Unión'],
      'Huacaybamba': ['Huacaybamba'],
      'Huamalíes': ['Llata'],
      'Leoncio Prado': ['Tingo María'],
      'Marañón': ['Huacrachuco'],
      'Pachitea': ['Panao'],
      'Puerto Inca': ['Puerto Inca'],
      'Lauricocha': ['Jesús'],
      'Yarowilca': ['Chavinillo'],
    },
  },
  ICA: {
    label: 'Ica',
    provinces: {
      'Ica': ['Ica', 'La Tinguiña', 'Los Aquijes', 'Parcona', 'Pueblo Nuevo', 'Salas', 'San José de los Molinos', 'San Juan Bautista', 'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario'],
      'Chincha': ['Chincha Alta', 'Pueblo Nuevo', 'Sunampe', 'Grocio Prado', 'Tambo de Mora'],
      'Nazca': ['Nazca', 'Vista Alegre', 'Marcona'],
      'Palpa': ['Palpa'],
      'Pisco': ['Pisco', 'San Andrés', 'San Clemente', 'Túpac Amaru Inca', 'Paracas'],
    },
  },
  JUNIN: {
    label: 'Junín',
    provinces: {
      'Huancayo': ['Huancayo', 'El Tambo', 'Chilca', 'Concepción', 'Pilcomayo'],
      'Chanchamayo': ['La Merced', 'Pichanaki', 'San Ramón'],
      'Chupaca': ['Chupaca'],
      'Concepción': ['Concepción'],
      'Jauja': ['Jauja'],
      'Junín': ['Junín'],
      'Satipo': ['Satipo'],
      'Tarma': ['Tarma'],
      'Yauli': ['La Oroya'],
    },
  },
  LA_LIBERTAD: {
    label: 'La Libertad',
    provinces: {
      'Trujillo': ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Víctor Larco Herrera'],
      'Ascope': ['Ascope', 'Casa Grande', 'Chicama', 'Chocope', 'Magdalena de Cao', 'Paiján', 'Rázuri', 'Santiago de Cao'],
      'Bolívar': ['Bolívar'],
      'Chepén': ['Chepén', 'Pacanga', 'Pueblo Nuevo'],
      'Gran Chimú': ['Cascas'],
      'Julcán': ['Julcán'],
      'Otuzco': ['Otuzco'],
      'Pacasmayo': ['San Pedro de Lloc', 'Guadalupe', 'Jequetepeque', 'Pacasmayo'],
      'Pataz': ['Tayabamba'],
      'Sánchez Carrión': ['Huamachuco'],
      'Santiago de Chuco': ['Santiago de Chuco'],
      'Virú': ['Virú', 'Chao', 'Guadalupito'],
    },
  },
  LAMBAYEQUE: {
    label: 'Lambayeque',
    provinces: {
      'Chiclayo': ['Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Pimentel', 'Reque', 'Santa Rosa', 'Monsefú', 'Eten', 'Eten Puerto', 'Cayaltí', 'Lagunas', 'Nueva Arica', 'Oyotún', 'Pátapo', 'Picsi', 'Pomalca', 'Pucalá', 'Saña', 'Tumán'],
      'Ferreñafe': ['Ferreñafe'],
      'Lambayeque': ['Lambayeque', 'Chochope', 'Íllimo', 'Jayanca', 'Mochumí', 'Mórrope', 'Motupe', 'Olmos', 'Pacora', 'Salas', 'San José', 'Túcume'],
    },
  },
  LORETO: {
    label: 'Loreto',
    provinces: {
      'Maynas': ['Iquitos', 'Belén', 'Punchana', 'San Juan Bautista'],
      'Alto Amazonas': ['Yurimaguas'],
      'Datem del Marañón': ['Barranca'],
      'Loreto': ['Nauta'],
      'Mariscal Ramón Castilla': ['Caballococha'],
      'Putumayo': ['San Antonio del Estrecho'],
      'Requena': ['Requena'],
      'Ucayali': ['Contamana'],
    },
  },
  MADRE_DE_DIOS: {
    label: 'Madre de Dios',
    provinces: {
      'Tambopata': ['Puerto Maldonado'],
      'Manu': ['Manu'],
      'Tahuamanu': ['Iñapari'],
    },
  },
  MOQUEGUA: {
    label: 'Moquegua',
    provinces: {
      'Mariscal Nieto': ['Moquegua'],
      'General Sánchez Cerro': ['Omate'],
      'Ilo': ['Ilo'],
    },
  },
  PASCO: {
    label: 'Pasco',
    provinces: {
      'Pasco': ['Cerro de Pasco', 'Chaupimarca', 'Yanacancha'],
      'Daniel Alcides Carrión': ['Yanahuanca'],
      'Oxapampa': ['Oxapampa'],
    },
  },
  PIURA: {
    label: 'Piura',
    provinces: {
      'Piura': ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande', 'Veintiséis de Octubre'],
      'Ayabaca': ['Ayabaca'],
      'Huancabamba': ['Huancabamba'],
      'Morropón': ['Chulucanas'],
      'Paita': ['Paita'],
      'Sechura': ['Sechura'],
      'Sullana': ['Sullana', 'Bellavista', 'Marcavelica'],
      'Talara': ['Talara', 'Pariñas', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora', 'El Alto'],
    },
  },
  PUNO: {
    label: 'Puno',
    provinces: {
      'Puno': ['Puno'],
      'Azángaro': ['Azángaro'],
      'Carabaya': ['Macusani'],
      'Chucuito': ['Juli'],
      'El Collao': ['Ilave'],
      'Huancané': ['Huancané'],
      'Lampa': ['Lampa'],
      'Melgar': ['Ayaviri'],
      'Moho': ['Moho'],
      'San Antonio de Putina': ['Putina'],
      'San Román': ['Juliaca'],
      'Sandia': ['Sandia'],
      'Yunguyo': ['Yunguyo'],
    },
  },
  SAN_MARTIN: {
    label: 'San Martín',
    provinces: {
      'Moyobamba': ['Moyobamba'],
      'Bellavista': ['Bellavista'],
      'El Dorado': ['San José de Sisa'],
      'Huallaga': ['Saposoa'],
      'Lamas': ['Lamas'],
      'Mariscal Cáceres': ['Juanjuí'],
      'Picota': ['Picota'],
      'Rioja': ['Rioja'],
      'San Martín': ['Tarapoto', 'Morales', 'La Banda de Shilcayo'],
      'Tocache': ['Tocache'],
    },
  },
  TACNA: {
    label: 'Tacna',
    provinces: {
      'Tacna': ['Tacna', 'Alto de la Alianza', 'Ciudad Nueva', 'Pocollay'],
      'Candarave': ['Candarave'],
      'Jorge Basadre': ['Locumba'],
      'Tarata': ['Tarata'],
    },
  },
  TUMBES: {
    label: 'Tumbes',
    provinces: {
      'Tumbes': ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'],
      'Contralmirante Villar': ['Zorritos'],
      'Zarumilla': ['Zarumilla', 'Aguas Verdes'],
    },
  },
  UCAYALI: {
    label: 'Ucayali',
    provinces: {
      'Coronel Portillo': ['Pucallpa', 'Callería', 'Manantay', 'Yarinacocha'],
      'Atalaya': ['Raymondi'],
      'Padre Abad': ['Aguaytía'],
      'Purús': ['Purús'],
    },
  },
};

export const DEPARTMENT_CODES = Object.keys(UBIGEO_PERU);

export const DEPARTMENT_LABELS = Object.fromEntries(
  Object.entries(UBIGEO_PERU).map(([code, data]) => [code, data.label]),
);

export const getProvinces = (deptCode) => {
  const dept = UBIGEO_PERU[deptCode];
  return dept ? Object.keys(dept.provinces) : [];
};

export const getDistricts = (deptCode, provinceName) => {
  const dept = UBIGEO_PERU[deptCode];
  if (!dept) return [];
  return dept.provinces[provinceName] ?? [];
};
