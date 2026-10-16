/* =============================================================================
   04_sp_process_commerce.sql
   Valida los registros de dbo.commerce de una fecha de proceso:
     1. pc_nomcomred no debe estar vacío.
     2. pc_numdoc no debe estar vacío, ni contener letras ni caracteres especiales.
   Los registros inválidos se mueven (DELETE ... OUTPUT) a commerce_quarantine
   con el motivo correspondiente, en una sola transacción.
   Devuelve la cantidad de registros insertados en commerce_quarantine.
   ============================================================================= */
USE IRouteDb;
GO
CREATE OR ALTER PROCEDURE dbo.sp_process_commerce
    @processdate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @quarantined INT = 0;

    BEGIN TRANSACTION;

    /* Un solo DELETE con OUTPUT: elimina de commerce e inserta en cuarentena
       atómicamente, sin tablas temporales ni cursores. */
    DELETE c
    OUTPUT
        deleted.id,
        deleted.pc_codcom,
        deleted.pc_nomcomred,
        deleted.pc_tipodoc,
        deleted.pc_numdoc,
        deleted.pc_direccion,
        deleted.pc_telefono,
        deleted.pc_email,
        deleted.pc_processdate,
        /* Motivo compuesto: un registro puede incumplir varias reglas */
        STUFF(
              CASE WHEN NULLIF(LTRIM(RTRIM(deleted.pc_nomcomred)), '') IS NULL
                   THEN N'; El nombre del comercio (nomcomred) se encuentra vacio' ELSE N'' END
            + CASE WHEN NULLIF(LTRIM(RTRIM(deleted.pc_numdoc)), '') IS NULL
                   THEN N'; El número (numdoc) se encuentra vacio' ELSE N'' END
            + CASE WHEN NULLIF(LTRIM(RTRIM(deleted.pc_numdoc)), '') IS NOT NULL
                    AND deleted.pc_numdoc LIKE '%[A-Za-z]%'
                   THEN N'; El número (numdoc) contiene letras' ELSE N'' END
            + CASE WHEN NULLIF(LTRIM(RTRIM(deleted.pc_numdoc)), '') IS NOT NULL
                    AND deleted.pc_numdoc LIKE '%[^0-9A-Za-z]%'
                   THEN N'; El número (numdoc) contiene caracteres especiales' ELSE N'' END
            , 1, 2, N'')
    INTO dbo.commerce_quarantine
        (commerce_id, pc_codcom, pc_nomcomred, pc_tipodoc, pc_numdoc, pc_direccion,
         pc_telefono, pc_email, pc_processdate, motivo)
    FROM dbo.commerce AS c
    WHERE c.pc_processdate = @processdate
      AND (
            NULLIF(LTRIM(RTRIM(c.pc_nomcomred)), '') IS NULL
         OR NULLIF(LTRIM(RTRIM(c.pc_numdoc)), '')    IS NULL
         OR c.pc_numdoc LIKE '%[^0-9]%'          -- cualquier cosa que no sea dígito
          );

    SET @quarantined = @@ROWCOUNT;

    COMMIT TRANSACTION;

    SELECT @quarantined AS quarantined_count;
END
GO
