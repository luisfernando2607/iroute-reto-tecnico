/* =============================================================================
   05_sp_get_commerce_quarantine.sql
   Lista los comercios en cuarentena, con filtro opcional por fecha de proceso
   y paginación (OFFSET/FETCH). Devuelve dos result sets: total y página.
   ============================================================================= */
USE IRouteDb;
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_commerce_quarantine
    @processdate DATE = NULL,
    @page        INT  = 1,
    @pagesize    INT  = 50
AS
BEGIN
    SET NOCOUNT ON;

    IF @page < 1 SET @page = 1;
    IF @pagesize < 1 OR @pagesize > 500 SET @pagesize = 50;

    SELECT COUNT(*) AS total
    FROM dbo.commerce_quarantine
    WHERE @processdate IS NULL OR pc_processdate = @processdate;

    SELECT id, commerce_id, pc_codcom, pc_nomcomred, pc_tipodoc, pc_numdoc,
           pc_direccion, pc_telefono, pc_email, pc_processdate, motivo, quarantined_at
    FROM dbo.commerce_quarantine
    WHERE @processdate IS NULL OR pc_processdate = @processdate
    ORDER BY quarantined_at DESC, id DESC
    OFFSET (@page - 1) * @pagesize ROWS FETCH NEXT @pagesize ROWS ONLY;
END
GO
