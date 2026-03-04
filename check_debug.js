const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
    try {
        console.log("--- DIAGNÓSTICO DE ROLES ---");
        const roles = await prisma.roles.findMany();
        console.log("Roles en DB:");
        roles.forEach(r => console.log(`ID: ${r.idRol}, Nombre: "${r.nombre}"`));

        console.log("\n--- DIAGNÓSTICO DE CALIFICACIONES ---");
        const totalCalificaciones = await prisma.calificaciones.count();
        console.log("Total Calificaciones:", totalCalificaciones);

        const ratings = await prisma.calificaciones.findMany({
            include: {
                calificado: {
                    include: {
                        rol: true
                    }
                }
            },
            take: 20
        });

        console.log("\nMuestra de Calificaciones (Primeras 20):");
        ratings.forEach(c => {
            const u = c.calificado;
            const rName = u?.rol?.nombre || "SIN ROL";
            console.log(`Calificacion ID: ${c.idCalificacion}, Calificado ID: ${c.idCalificado}, Nombre: "${u?.nombre}", Rol: "${rName}", Puntos: ${c.puntuacion}`);
        });

        const conductorRolesOutput = roles.filter(r => r.nombre.toUpperCase().includes('COND'));
        console.log("\nRoles que parecen ser de CONDUCTOR:", JSON.stringify(conductorRolesOutput));

        const viajerRolesOutput = roles.filter(r => r.nombre.toUpperCase().includes('VIAJ') || r.nombre.toUpperCase().includes('PASAJ'));
        console.log("Roles que parecen ser de VIAJERO:", JSON.stringify(viajerRolesOutput));

    } catch (e) {
        console.error("ERROR EN DEBUG:", e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
