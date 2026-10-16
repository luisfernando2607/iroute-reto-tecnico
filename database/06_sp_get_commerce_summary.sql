/* =============================================================================
   06_sp_get_commerce_summary.sql
   Resumen por fecha de proceso: registros pendientes en commerce y registros
   en cuarentena. Alimenta la pantalla "Procesar" del front.
   ============================================================================= */
USE IRouteDb;
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_commerce_summary
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        d.pc_processdate,
        ISNULL(c.pending, 0)     AS pending_count,
        ISNULL(q.quarantined, 0) AS quarantined_count
    FROM (
        SELECT pc_processdate FROM dbo.commerce
        UNION
        SELECT pc_processdate FROM dbo.commerce_quarantine
    ) AS d
    LEFT JOIN (
        SELECT pc_processdate, COUNT(*) AS pending
        FROM dbo.commerce GROUP BY pc_processdate
    ) AS c ON c.pc_processdate = d.pc_processdate
    LEFT JOIN (
        SELECT pc_processdate, COUNT(*) AS quarantined
        FROM dbo.commerce_quarantine GROUP BY pc_processdate
    ) AS q ON q.pc_processdate = d.pc_processdate
    ORDER BY d.pc_processdate DESC;
END
GO
