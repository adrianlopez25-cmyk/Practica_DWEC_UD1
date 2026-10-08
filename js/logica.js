const participantes = [
{
id: 483721,
nombre: "Ana García",
edad: 17,
tipo: "estudiante",
modalidad: "presencial",
experiencia: 4,
fechaInscripcion: "2026-10-08T08:30:00.000Z"
},
{
id: 138009,
nombre: "Pedro Lopez",
edad: 29,
tipo: "profesional",
modalidad: "online",
experiencia: 8,
fechaInscripcion: "2026-3-0T09:00:00.000Z"
},
{
id: 853000,
nombre: "Carlos perez",
edad: 90,
tipo: "invitado",
modalidad: "presencial",
experiencia: 9.999,
fechaInscripcion: "2020-9-0T09:00:00.000Z"
}
];

//Defino un id de prueba para comprobar si es correcto
const idNuevo=900000;
for(let i;i<50;i++){
    if(idNuevo!==participantes.id){
        Math.floor(Math.random()*999999)+100000;
    }
}