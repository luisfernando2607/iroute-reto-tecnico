/* =============================================================================
   03_sp_create_commerce.sql
   Inserta en dbo.commerce todas las filas recibidas en el TVP.
   Devuelve la cantidad de registros insertados.
   ============================================================================= */
USE IRouteDb;
GO
CREATE OR ALTER PROCEDURE dbo.sp_create_commerce
    @rows dbo.CommerceTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.commerce
        (pc_codcom, pc_nomcomred, pc_tipodoc, pc_numdoc, pc_direccion, pc_telefono, pc_email, pc_processdate)
    SELECT
        NULLIF(LTRIM(RTRIM(pc_codcom)), ''),
        NULLIF(LTRIM(RTRIM(pc_nomcomred)), ''),
        NULLIF(LTRIM(RTRIM(pc_tipodoc)), ''),
        NULLIF(LTRIM(RTRIM(pc_numdoc)), ''),
        NULLIF(LTRIM(RTRIM(pc_direccion)), ''),
        NULLIF(LTRIM(RTRIM(pc_telefono)), ''),
        NULLIF(LTRIM(RTRIM(pc_email)), ''),
        pc_processdate
    FROM @rows;

    SELECT @@ROWCOUNT AS inserted_count;
END
GO
