const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
    try {
        const roles = await prisma.roles.findMany();
        console.log("ROLES", JSON.stringify(roles));

        // Contar calificaciones por rol del calificado
        const stats = await prisma.calificaciones.groupBy({
            by: ['idCalificado'],
            _count: true
        });

        const userIds = stats.map(s => s.idCalificado);
        const users = await prisma.usuarios.findMany({
            where: { idUsuarios: { in: userIds } },
            select: { idRol: true, rol: { select: { nombre: true } } }
        });

        const roleCounts = {};
        users.forEach(u => {
            const rName = u.rol.nombre;
            roleCounts[rName] = (roleCounts[rName] || 0) + 1;
        });

        console.log("CALIFICADOS_ROLES", JSON.stringify(roleCounts));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
