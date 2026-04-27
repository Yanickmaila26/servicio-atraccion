USE ServicioAtraccionDB;
GO

-- ======================================================
-- 1. LIMPIEZA TOTAL (En estricto orden para evitar errores FK)
-- ======================================================
DELETE FROM [dbo].[BookingDetail];
DELETE FROM [dbo].[Booking];
DELETE FROM [dbo].[Payment];

-- Nuevas tablas de horarios
DELETE FROM [dbo].[ProductScheduleTime];
DELETE FROM [dbo].[ProductScheduleTemplate];

DELETE FROM [dbo].[AvailabilitySlot];
DELETE FROM [dbo].[PriceTier];
DELETE FROM [dbo].[ProductInclusion];
DELETE FROM [dbo].[ProductTranslation];
DELETE FROM [dbo].[ProductOption];

DELETE FROM [dbo].[AttractionInclusion];
DELETE FROM [dbo].[AttractionTag];
DELETE FROM [dbo].[AttractionMedia];
DELETE FROM [dbo].[AttractionLanguage];
DELETE FROM [dbo].[AttractionTranslation];

DELETE FROM [dbo].[TourStopMedia];
DELETE FROM [dbo].[TourStop];
DELETE FROM [dbo].[TourItinerary];

DELETE FROM [dbo].[AudioGuideStop];
DELETE FROM [dbo].[AudioGuide];

DELETE FROM [dbo].[Attraction];
DELETE FROM [dbo].[SubcategoryTranslation];
DELETE FROM [dbo].[Subcategory];
DELETE FROM [dbo].[CategoryTranslation];
DELETE FROM [dbo].[Category];

DELETE FROM [dbo].[Tag];
DELETE FROM [dbo].[InclusionItem];

DELETE FROM [dbo].[Client];
DELETE FROM [dbo].[UserRole];
DELETE FROM [dbo].[Users];
DELETE FROM [dbo].[Role];
DELETE FROM [dbo].[Locations];
GO

-- ======================================================
-- 2. ROLES
-- ======================================================
INSERT INTO [dbo].[Role] ([Id], [Name], [Description]) VALUES
    ('A1111111-1111-1111-1111-111111111111', 'Admin', 'Administración total: usuarios, configuración y auditoría'),
    ('B2222222-2222-2222-2222-222222222222', 'Partner', 'Gestión de catálogo propio, precios, disponibilidad, itinerarios y POS'),
    ('C3333333-3333-3333-3333-333333333333', 'Client', 'Búsqueda de catálogo, reserva y proceso de pago de atracciones');
GO

-- ======================================================
-- 3. USUARIOS (yanick_*) - Password: secreto123 (BCrypt Hash)
-- ======================================================
DECLARE @BCryptHash NVARCHAR(MAX) = '$2a$11$TVBFSiEsaZ4cKgM.H.lTU.cvHVH4F6y9JxAplLsudLc0F53cPWMVe';

INSERT INTO [dbo].[Users] ([Id], [Email], [PasswordHash], [IsActive]) VALUES
    ('10000000-0000-0000-0000-000000000001', 'yanick_admin@atraccion.com', @BCryptHash, 1),
    ('20000000-0000-0000-0000-000000000002', 'yanick_partner@atraccion.com', @BCryptHash, 1),
    ('30000000-0000-0000-0000-000000000003', 'yanick_client@atraccion.com', @BCryptHash, 1);

INSERT INTO [dbo].[UserRole] ([UserId], [RoleId]) VALUES
    ('10000000-0000-0000-0000-000000000001', 'A1111111-1111-1111-1111-111111111111'),
    ('20000000-0000-0000-0000-000000000002', 'B2222222-2222-2222-2222-222222222222'),
    ('30000000-0000-0000-0000-000000000003', 'C3333333-3333-3333-3333-333333333333');
GO

-- ======================================================
-- 4. UBICACIONES (Ecuador)
-- ======================================================
DECLARE @EcuId UNIQUEIDENTIFIER = 'EC000000-0000-0000-0000-000000000000';
INSERT INTO [dbo].[Locations] ([Id], [Name], [Type], [CountryCode]) VALUES (@EcuId, 'Ecuador', 'Country', 'EC');

DECLARE @PicId UNIQUEIDENTIFIER = 'EC000000-0000-0000-0000-000000000001';
DECLARE @GuaId UNIQUEIDENTIFIER = 'EC000000-0000-0000-0000-000000000002';
DECLARE @GalId UNIQUEIDENTIFIER = 'EC000000-0000-0000-0000-000000000003';
DECLARE @AzuId UNIQUEIDENTIFIER = 'EC000000-0000-0000-0000-000000000004';
DECLARE @ImbId UNIQUEIDENTIFIER = 'EC000000-0000-0000-0000-000000000005';
DECLARE @ManId UNIQUEIDENTIFIER = 'EC000000-0000-0000-0000-000000000006';

INSERT INTO [dbo].[Locations] ([Id], [Name], [Type], [ParentId]) VALUES
    (@PicId, 'Pichincha', 'State', @EcuId),
    (@GuaId, 'Guayas', 'State', @EcuId),
    (@GalId, 'Galápagos', 'State', @EcuId),
    (@AzuId, 'Azuay', 'State', @EcuId),
    (@ImbId, 'Imbabura', 'State', @EcuId),
    (@ManId, 'Manabí', 'State', @EcuId);

INSERT INTO [dbo].[Locations] ([Name], [Type], [ParentId]) VALUES
    ('Quito', 'City', @PicId),
    ('Guayaquil', 'City', @GuaId),
    ('Santa Cruz', 'City', @GalId),
    ('Cuenca', 'City', @AzuId),
    ('Ibarra', 'City', @ImbId),
    ('Manta', 'City', @ManId);
GO

-- ======================================================
-- 5. CATEGORÍAS Y SUBCATEGORÍAS
-- ======================================================
DECLARE @CatCult UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[Category] ([Id], [Slug], [Name], [IconUrl], [SortOrder]) VALUES 
    (@CatCult, 'museos-arte-cultura', 'Museos, arte y cultura', 'museum.png', 1);

INSERT INTO [dbo].[Subcategory] ([CategoryId], [Slug], [Name]) VALUES
    (@CatCult, 'museos-culturales', 'Museos culturales'),
    (@CatCult, 'monumentos-historicos', 'Monumentos y edificios históricos'),
    (@CatCult, 'exposiciones-galerias', 'Exposiciones y galerías');

DECLARE @CatEnt UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[Category] ([Id], [Slug], [Name], [IconUrl], [SortOrder]) VALUES 
    (@CatEnt, 'entretenimiento-tickets', 'Entretenimiento y tickets', 'ticket.png', 2);

INSERT INTO [dbo].[Subcategory] ([CategoryId], [Slug], [Name]) VALUES
    (@CatEnt, 'parques-tematicos', 'Parques temáticos'),
    (@CatEnt, 'conciertos-festivales', 'Conciertos y festivales'),
    (@CatEnt, 'deportes', 'Eventos deportivos');
GO

-- ======================================================
-- 6. TICKET CATEGORIES (Catálogo)
-- ======================================================
INSERT INTO [dbo].[TicketCategory] ([Id], [Name], [NameEn], [AgeRangeMin], [AgeRangeMax], [SortOrder]) VALUES
    ('A1B2C3D4-E5F6-4A1B-8C9D-0E1F2A3B4C5D', 'Adulto', 'Adult (18-100)', 18, 100, 1),
    ('B2C3D4E5-F6A1-4B2C-9D0E-1F2A3B4C5D6E', 'Adulto (13-64)', 'Adult (13-64)', 13, 64, 2),
    ('C3D4E5F6-A1B2-4C3D-0E1F-2A3B4C5D6E7F', 'Júnior', 'Junior (5-12)', 5, 12, 3),
    ('D4E5F6A1-B2C3-4D4E-1F2A-3B4C5D6E7F8A', 'Infantil', 'Infant (0-4)', 0, 4, 4);
GO

-- ======================================================
-- 7. TAGS E INCLUSIONES
-- ======================================================
INSERT INTO [dbo].[Tag] ([Name], [Slug]) VALUES 
    ('Aventura', 'aventura'), 
    ('Cultura', 'cultura'),
    ('Romántico', 'romantico'), 
    ('Nocturno', 'nocturno'), 
    ('Fotografía', 'fotografia'),
    ('Lujo', 'lujo');

INSERT INTO [dbo].[InclusionItem] ([IconSlug], [DefaultText], [LanguageId]) VALUES 
    ('bus', 'Transporte', 1), 
    ('utensils', 'Almuerzo', 1),
    ('coffee', 'Snacks y bebidas', 1),
    ('wifi', 'WiFi a bordo', 1),
    ('hotel', 'Recogida en el hotel', 1),
    ('shield', 'Seguro de viaje', 1),
    ('headphones', 'Audioguía incluida', 1);
GO
