/* =============================================================================
   i-Route - Reto técnico
   01_schema.sql : Base de datos, tablas y tipo de tabla (TVP)

   Idempotente: se puede ejecutar varias veces sin efectos secundarios.
   ============================================================================= */
IF DB_ID(N'IRouteDb') IS NULL
    CREATE DATABASE IRouteDb;
GO
USE IRouteDb;
GO

/* -----------------------------------------------------------------------------
   Tabla commerce
   La estructura replica las columnas del archivo commerce_DDMMYYYY.csv.
   ----------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.commerce', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.commerce
    (
        id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_commerce PRIMARY KEY,
        pc_codcom       VARCHAR(20)   NULL,
        pc_nomcomred    VARCHAR(150)  NULL,
        pc_tipodoc      VARCHAR(5)    NULL,
        pc_numdoc       VARCHAR(30)   NULL,
        pc_direccion    VARCHAR(250)  NULL,
        pc_telefono     VARCHAR(30)   NULL,
        pc_email        VARCHAR(150)  NULL,
        pc_processdate  DATE          NOT NULL,
        created_at      DATETIME2(0)  NOT NULL CONSTRAINT DF_commerce_created_at DEFAULT (SYSUTCDATETIME())
    );

    /* El procesamiento siempre filtra por fecha de proceso */
    CREATE INDEX IX_commerce_processdate ON dbo.commerce (pc_processdate);
END
GO

/* -----------------------------------------------------------------------------
   Tabla commerce_quarantine
   Misma estructura que commerce. La columna "motivo" se agrega en el script
   02_alter_quarantine.sql tal como lo pide el enunciado.
   ----------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.commerce_quarantine', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.commerce_quarantine
    (
        id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_commerce_quarantine PRIMARY KEY,
        commerce_id     BIGINT        NOT NULL,   -- id original en commerce (trazabilidad)
        pc_codcom       VARCHAR(20)   NULL,
        pc_nomcomred    VARCHAR(150)  NULL,
        pc_tipodoc      VARCHAR(5)    NULL,
        pc_numdoc       VARCHAR(30)   NULL,
        pc_direccion    VARCHAR(250)  NULL,
        pc_telefono     VARCHAR(30)   NULL,
        pc_email        VARCHAR(150)  NULL,
        pc_processdate  DATE          NOT NULL,
        quarantined_at  DATETIME2(0)  NOT NULL CONSTRAINT DF_commerce_quarantine_at DEFAULT (SYSUTCDATETIME())
    );

    CREATE INDEX IX_commerce_quarantine_processdate ON dbo.commerce_quarantine (pc_processdate);
END
GO

/* -----------------------------------------------------------------------------
   Tipo de tabla (Table-Valued Parameter) para carga masiva en un solo viaje
   a la base de datos desde el API.
   ----------------------------------------------------------------------------- */
IF TYPE_ID(N'dbo.CommerceTableType') IS NULL
BEGIN
    CREATE TYPE dbo.CommerceTableType AS TABLE
    (
        pc_codcom       VARCHAR(20)   NULL,
        pc_nomcomred    VARCHAR(150)  NULL,
        pc_tipodoc      VARCHAR(5)    NULL,
        pc_numdoc       VARCHAR(30)   NULL,
        pc_direccion    VARCHAR(250)  NULL,
        pc_telefono     VARCHAR(30)   NULL,
        pc_email        VARCHAR(150)  NULL,
        pc_processdate  DATE          NOT NULL
    );
END
GO
