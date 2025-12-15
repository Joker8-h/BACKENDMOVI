-- CreateTable
CREATE TABLE `Documentacion` (
    `idDocumentacion` INTEGER NOT NULL AUTO_INCREMENT,
    `idUsuario` INTEGER NOT NULL,
    `tipoDocumento` VARCHAR(50) NULL,
    `numeroDocumento` VARCHAR(50) NULL,
    `imagenFrontalUrl` VARCHAR(255) NULL,
    `imagenDorsalUrl` VARCHAR(255) NULL,
    `estado` ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    `fechaSubida` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observaciones` VARCHAR(255) NULL,

    UNIQUE INDEX `Documentacion_idUsuario_key`(`idUsuario`),
    PRIMARY KEY (`idDocumentacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Documentacion` ADD CONSTRAINT `Documentacion_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `Usuarios`(`idUsuarios`) ON DELETE RESTRICT ON UPDATE CASCADE;
