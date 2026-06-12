# Graph Report - .  (2026-06-13)

## Corpus Check
- 236 files · ~380,516 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1551 nodes · 3163 edges · 86 communities (64 shown, 22 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 262 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Asset Service Backend|Asset Service Backend]]
- [[_COMMUNITY_Frontend Asset Templates|Frontend Asset Templates]]
- [[_COMMUNITY_Document Revision DTOs|Document Revision DTOs]]
- [[_COMMUNITY_REST API Controllers|REST API Controllers]]
- [[_COMMUNITY_Document List UI|Document List UI]]
- [[_COMMUNITY_Canvas Layer Renderer|Canvas Layer Renderer]]
- [[_COMMUNITY_Image Utils Testing|Image Utils Testing]]
- [[_COMMUNITY_Exception Handling|Exception Handling]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_AI Image Controller|AI Image Controller]]
- [[_COMMUNITY_Document CRUD DTOs|Document CRUD DTOs]]
- [[_COMMUNITY_Zustand Clipboard History|Zustand Clipboard History]]
- [[_COMMUNITY_Startup Utility Scripts|Startup Utility Scripts]]
- [[_COMMUNITY_Content Validation Testing|Content Validation Testing]]
- [[_COMMUNITY_Document Service Testing|Document Service Testing]]
- [[_COMMUNITY_Image Dimension Parsing|Image Dimension Parsing]]
- [[_COMMUNITY_Property Panel UI|Property Panel UI]]
- [[_COMMUNITY_Test Image Fixtures|Test Image Fixtures]]
- [[_COMMUNITY_AI Image API Client|AI Image API Client]]
- [[_COMMUNITY_Keyboard Shortcuts Document|Keyboard Shortcuts Document]]
- [[_COMMUNITY_Canvas Stage Components|Canvas Stage Components]]
- [[_COMMUNITY_SVG E-Commerce Templates|SVG E-Commerce Templates]]
- [[_COMMUNITY_Editor Data Auto-Save|Editor Data Auto-Save]]
- [[_COMMUNITY_AI Service Volcengine|AI Service Volcengine]]
- [[_COMMUNITY_Document API Client|Document API Client]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Sketch File Parser|Sketch File Parser]]
- [[_COMMUNITY_Legacy Image Utils|Legacy Image Utils]]
- [[_COMMUNITY_Ad Image Collection|Ad Image Collection]]
- [[_COMMUNITY_App Providers Config|App Providers Config]]
- [[_COMMUNITY_Network Image Testing|Network Image Testing]]
- [[_COMMUNITY_OpenFeign Documentation|OpenFeign Documentation]]
- [[_COMMUNITY_Volcengine Feign Config|Volcengine Feign Config]]
- [[_COMMUNITY_Volcengine DTO Mapping|Volcengine DTO Mapping]]
- [[_COMMUNITY_Node Build Config|Node Build Config]]
- [[_COMMUNITY_AI Image Frontend Utils|AI Image Frontend Utils]]
- [[_COMMUNITY_Layer Operations|Layer Operations]]
- [[_COMMUNITY_Abstract Art Images|Abstract Art Images]]
- [[_COMMUNITY_Icon Favicon Assets|Icon Favicon Assets]]
- [[_COMMUNITY_Security Configuration|Security Configuration]]
- [[_COMMUNITY_File Parsing Utils|File Parsing Utils]]
- [[_COMMUNITY_Volcengine Visual Client|Volcengine Visual Client]]
- [[_COMMUNITY_Export Image Utils|Export Image Utils]]
- [[_COMMUNITY_Startup Shell Scripts|Startup Shell Scripts]]
- [[_COMMUNITY_Snapping Utilities|Snapping Utilities]]
- [[_COMMUNITY_Network Test Images|Network Test Images]]
- [[_COMMUNITY_Kong Access Log|Kong Access Log]]
- [[_COMMUNITY_Layer Tree Operations|Layer Tree Operations]]
- [[_COMMUNITY_Dashboard Music Templates|Dashboard Music Templates]]
- [[_COMMUNITY_Social Media Icons|Social Media Icons]]
- [[_COMMUNITY_Web MVC Config|Web MVC Config]]
- [[_COMMUNITY_Google Fonts Loader|Google Fonts Loader]]
- [[_COMMUNITY_AI Processing Concepts|AI Processing Concepts]]
- [[_COMMUNITY_Volcengine Properties|Volcengine Properties]]
- [[_COMMUNITY_Application Entry Point|Application Entry Point]]
- [[_COMMUNITY_Snap Guides Component|Snap Guides Component]]
- [[_COMMUNITY_DevOps Startup|DevOps Startup]]
- [[_COMMUNITY_Financial AI Docs|Financial AI Docs]]
- [[_COMMUNITY_RateLimiter Documentation|RateLimiter Documentation]]
- [[_COMMUNITY_Grayscale Release Docs|Grayscale Release Docs]]
- [[_COMMUNITY_PG Partition Index Docs|PG Partition Index Docs]]
- [[_COMMUNITY_Document Mutation APIs|Document Mutation APIs]]
- [[_COMMUNITY_Root TSConfig|Root TSConfig]]
- [[_COMMUNITY_LayerRenderer Concepts|LayerRenderer Concepts]]
- [[_COMMUNITY_Snap Algorithms|Snap Algorithms]]
- [[_COMMUNITY_Vite Branding|Vite Branding]]
- [[_COMMUNITY_Welcome Screen SVG|Welcome Screen SVG]]
- [[_COMMUNITY_Google Fonts Hook|Google Fonts Hook]]
- [[_COMMUNITY_API Client Instance|API Client Instance]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `EditorLayer` - 47 edges
2. `ImageUtilsTest` - 41 edges
3. `useEditorStore` - 38 edges
4. `ok()` - 31 edges
5. `AiImageService` - 29 edges
6. `generateId()` - 26 edges
7. `AssetService` - 25 edges
8. `DocumentService` - 24 edges
9. `ImageUtils` - 22 edges
10. `Test` - 22 edges

## Surprising Connections (you probably didn't know these)
- `TestRegex` --conceptually_related_to--> `ImageUtils Dimension Parser`  [INFERRED]
  backend/TestRegex.java → .claude/agent-memory/code-inspector/imageutils_review.md
- `permitAll() Catch-all Security Risk` --conceptually_related_to--> `AssetController`  [INFERRED]
  backend/.claude/agent-memory/code-inspector/security-overview.md → backend/src/main/java/com/example/editor/asset/controller/AssetController.java
- `One-Click Startup Script` --conceptually_related_to--> `Flyway Database Migration`  [INFERRED]
  start.sh → STARTUP.md
- `TestGif` --references--> `ImageUtils Dimension Parser`  [EXTRACTED]
  backend/TestGif.java → .claude/agent-memory/code-inspector/imageutils_review.md
- `permitAll() Catch-all Security Risk` --conceptually_related_to--> `AiImageController`  [INFERRED]
  backend/.claude/agent-memory/code-inspector/security-overview.md → backend/src/main/java/com/example/editor/ai/controller/AiImageController.java

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SVG Upload-Edit-Save Pipeline** — svg_data_flow, svg_ungroup_decomposition, layer_renderer, jsonb_whole_document_storage, auto_save_debounce [INFERRED 0.85]
- **AI Image Processing Stack** — ai_image_processing, volcengine_visual_api, openfeign_httpclient5, ssrf_protection, graceful_ai_degradation [EXTRACTED 1.00]
- **Development Startup Environment** — one_click_startup, docker_postgres_setup, flyway_migration, spring_profile_multi_env [EXTRACTED 1.00]
- **AI Image Processing Pipeline** — ai_controller_aiimagecontroller, ai_service_aiimageservice, ai_client_volcenginevisualclient, ai_client_volcenginefeignconfig [EXTRACTED 1.00]
- **Public-to-Volcengine DTO Mapping** — ai_dto_mattingrequest, ai_dto_volcenginemattingrequest, ai_dto_outpaintingrequest, ai_dto_volcengineoutpaintingrequest, ai_dto_inpaintingrequest, ai_dto_volcengineinpaintingrequest, ai_dto_superresolutionrequest, ai_dto_volcenginessuperresolutionrequest [EXTRACTED 1.00]
- **Volcengine Credential Configuration Chain** — ai_config_volcengineproperties, ai_client_volcenginefeignconfig, ai_service_aiimageservice [EXTRACTED 1.00]
- **Exception Hierarchy for Asset Module** — exception_businessexception, exception_filevalidationexception, exception_notfoundexception, exception_conflictexception [EXTRACTED 1.00]
- **Asset Upload Validation Pipeline** — service_assetservice, exception_filevalidationexception, util_svgsanitizer, mapper_assetmapper, security_usercontext [EXTRACTED 1.00]
- **Global Exception Handling** — exception_globalexceptionhandler, exception_businessexception, exception_notfoundexception, exception_conflictexception, exception_filevalidationexception, response_apiresponse [EXTRACTED 1.00]
- **Feign HttpClient5 Configuration** — config_httpclientconfig, config_httpclientproperties [EXTRACTED 1.00]
- **SVG Sanitization Cross-Cutting Concern** — util_svgsanitizer, service_assetservice, util_contentvalidator [EXTRACTED 1.00]
- **Image Dimension Parsing Utilities** — util_imageutils, util_imageutils_dimension, util_legacyimageutils, util_legacyimageutils_dimension [EXTRACTED 1.00]
- **Asset Entity to DTO Mapping Chain** — entity_editorasset, dto_assetresponse, dto_assetlistresponse, dto_assetdetailresponse, dto_assetdetailresponse_exifmetadata [INFERRED 0.85]
- **Document CRUD flow through layers** — dto_createdocumentrequest, dto_updatedocumentrequest, dto_updatetitlerequest, service_documentservice, mapper_documentmapper, entity_editordocument, dto_documentdetailresponse, dto_documentlistresponse, dto_documentupdateresponse [EXTRACTED 1.00]
- **Revision CRUD flow through layers** — controller_revisioncontroller, dto_createrevisionrequest, service_revisionservice, mapper_revisionmapper, entity_editordocumentrevision, dto_revisionresponse, dto_revisiondetailresponse [EXTRACTED 1.00]
- **Revision module depends on Document module for document ownership validation and content restore** — service_revisionservice, service_documentservice, entity_editordocument [EXTRACTED 1.00]
- **Spring profile-specific datasource configuration** — config_application_yml, config_application_mac_yml, config_application_windows_yml [EXTRACTED 1.00]
- **Database schema initialization via Flyway migrations** — migration_v1_create_tables, migration_v2_insert_default_user, table_app_user, table_editor_document, table_editor_asset, table_editor_document_revision, config_application_yml [EXTRACTED 1.00]
- **OpenFeign Documentation Cluster** — docs_openfeign_httpclient5_config, docs_openfeign_logging_config, docs_openfeign_config_priority, docs_openfeign_timeout_config [INFERRED 0.95]
- **Kong Documentation Cluster** — docs_kong_access_log_four_metrics, docs_kong_diagnose_gemini [INFERRED 0.95]
- **ImageUtils Test Suite** — common_util_imageutilstest, common_util_networkimagetest, common_util_imageutils, common_util_legacyimageutils [INFERRED 0.85]
- **Service Unit Test Pattern** — asset_service_test_assetservicetest, document_service_documentservicetest [INFERRED 0.85]
- **Frontend Configuration Cluster** — frontend_vite_config, frontend_package_json, frontend_tsconfig_app, frontend_tsconfig_node, frontend_eslint_config [INFERRED 0.85]
- **Kong Four Metrics Bottleneck Detection** — docs_kong_access_log_rt, docs_kong_access_log_uct, docs_kong_access_log_uht, docs_kong_access_log_urt, docs_kong_access_log_five_segment_breakdown [INFERRED 0.95]
- **OpenFeign Configuration Priority Layers** — docs_openfeign_config_priority_feignclientfactorybean, docs_openfeign_config_priority_default_to_properties, docs_openfeign_config_priority_inherit_parent_context, docs_openfeign_config_priority_contextid, docs_openfeign_config_priority_merge_strategy [INFERRED 0.90]
- **Provider Nesting Order** — providers_appproviders, router_router [EXTRACTED 1.00]
- **Canvas Component Composition** — editorstage_editorstage, layerrenderer_layerrenderer, selectiontransformer_selectiontransformer, gridoverlay_gridoverlay, smartguides_smartguides [EXTRACTED 1.00]
- **Editor Three-Panel Layout** — editorlayout_editorlayout, layertreepanel_layertreepanel, editorstage_editorstage, propertypanel_propertypanel [EXTRACTED 1.00]
- **AI Image Processing Pipeline** — propertypanel_aiimagetools, aiimage_getaistatus, aiimage_mattingimage, aiimage_outpaintingimage, aiimage_inpaintingimage, aiimage_superresolutionimage [EXTRACTED 1.00]
- **Revision History Flow** — historypanel_historypanel, revision_createrevision, revision_listrevisions, revision_restorerevision, document_getdocument [EXTRACTED 1.00]
- **Asset Picker Flow** — assetpicker_assetpicker, asset_listassets, asset_uploadasset, assetcard_assetcard [EXTRACTED 1.00]
- **Smart Guide Drag System** — layerrenderer_layerrenderer, smartguides_calculateguidelines, smartguides_smartguides [EXTRACTED 1.00]
- **Zustand store slice composition** — slices_documentslice_createdocumentslice, slices_selectionslice_createselectionslice, slices_clipboardslice_createclipboardslice, slices_viewportslice_createviewportslice, slices_uipreferencesslice_createuipreferencesslice, slices_drawingslice_createdrawingslice, slices_layerslice_createlayerslice, store_editorstore_useeditorstore [EXTRACTED 1.00]
- **pushHistory integration across all mutating slices** — slices_clipboardslice_createclipboardslice, slices_documentslice_createdocumentslice, slices_drawingslice_createdrawingslice, slices_layerslice_createlayerslice, store_history_pushhistory [EXTRACTED 1.00]
- **Document switch cleanup: cancelPendingLayerPatch + initHistory** — slices_documentslices_setdocument, slices_layerslice_cancelpendinglayerpatch, store_history_inithistory [EXTRACTED 1.00]
- **Editable poster template system: image layer to group conversion** — data_imagetemplates_buildeditabletemplatefromimagelayer, data_imagetemplates_getprimarytemplatetextlayerid, data_imagetemplates_normalizeposterlayers, data_imagetemplates_haseditabletemplateforimage, slices_layerslice_convertimagelayertotemplate [EXTRACTED 1.00]
- **Image export pipeline: PNG/JPEG/WebP/PDF/SVG with multiple export modes** — hooks_useexportimage_useexportimage, hooks_useexportimage_buildsvgfromlayers, hooks_useexportimage_layertosvg, hooks_useexportimage_downloadblob, hooks_useexportimage_calculatecontentbounds, hooks_useexportimage_calculateselectedbounds [EXTRACTED 1.00]
- **Undo/Redo via keyboard: useKeyboardShortcuts -> history module -> setContentSilent** — hooks_usekeyboardshortcuts_usekeyboardshortcuts, store_history_undo, store_history_redo, store_history_canundo, store_history_canredo, slices_documentslices_setcontentsilent [EXTRACTED 1.00]
- **File Parsing Pipeline** — fileparser_parsedesignfile, fileparser_detectfiletype, fileparser_parsesvgfile, sketchparser_parsesketchfile, localimageimport_createlayerfromlocalimage, svgparser_parsesvgelements, svgparser_convertsvgelementstolayers, svgparser_importsvgasimage, svgparser_importsvgassvglayer [EXTRACTED 1.00]
- **Layer Tree CRUD Operations** — layertreeoperations_findlayerbyid, layertreeoperations_updatelayerintree, layertreeoperations_removelayerfromtree, layertreeoperations_replacelayerintree, layertreeoperations_addlayertotree, layertreeoperations_togglelayerintree, layertreeoperations_getparentid [EXTRACTED 1.00]
- **Layer Z-Order Operations** — layertreeoperations_movelayerup, layertreeoperations_movelayerdown, layertreeoperations_bringtofront, layertreeoperations_sendtoback [EXTRACTED 1.00]
- **Snap and Alignment System** — snapping_snapposition, snapping_snaptolayers, snapping_snaptoequalspacing, snapping_getboundingbox [EXTRACTED 1.00]
- **Document List Page Composition** — documentlist_documentlistpage, documentlist_documentcard, documentlist_emptystate, documentlist_createdocumentmodal, documentlist_renamedocumentmodal, documentlist_templatebrowsermodal, hooks_usedocumentactions [EXTRACTED 1.00]
- **Document Template Data Flow** — templates_documenttemplates, templates_documenttemplate, types_editorlayer, documentlist_templatebrowsermodal, hooks_usedocumentactions, presets_canvaspresets [EXTRACTED 1.00]
- **Editor Layer Type Hierarchy** — types_baselayer, types_editorlayer, types_rectlayer, types_ellipselayer, types_textlayer, types_imagelayer, types_svglayer, types_grouplayer, types_linelayer, types_starlayer, types_polygonlayer [EXTRACTED 1.00]
- **Document List Data Fetching** — document_list_hooks_usedocuments_usedocuments, shared_lib_api_api, document_list_hooks_usedocuments_documentitem [INFERRED 0.85]
- **Editor Page Initialization** — editor_index_editorpage, editor_index_document_loading_flow [EXTRACTED 1.00]
- **API Client Infrastructure** — shared_lib_api_api, shared_lib_api_api_auth_config, shared_lib_api_response_interceptor [EXTRACTED 1.00]
- **WebP Subformat Coverage** — backend_backend_test_images_test_vp8_webp, backend_backend_test_images_test_vp8l_webp, backend_backend_test_images_test_vp8x_webp, concept_webp_subformat_vp8, concept_webp_subformat_vp8l, concept_webp_subformat_vp8x [EXTRACTED 1.00]
- **GIF Format Variety Testing** — backend_network_test_images_gif_giphy_1_gif, backend_network_test_images_gif_giphy_2_gif, backend_network_test_images_gif_generated_1_gif, backend_network_test_images_gif_generated_2_gif, backend_network_test_images_gif_quality_1_gif, backend_network_test_images_gif_quality_2_gif, backend_backend_test_images_test_gif, backend_backend_network_test_images_gif_animated_1_gif [EXTRACTED 1.00]
- **Image Dimension Parsing Test Matrix** — backend_backend_test_images_test_jpg, backend_backend_test_images_test_gif, backend_backend_test_images_test_vp8_webp, backend_backend_test_images_test_vp8l_webp, backend_backend_test_images_test_vp8x_webp, backend_backend_network_test_images_google_webp_webp, backend_backend_network_test_images_local_abstract_1_jpg, backend_backend_network_test_images_local_landscape_jpg [EXTRACTED 1.00]
- **Network Test Image Suite** — network_test_images_google_webp_webp, network_test_images_jpeg_local1, network_test_images_jpeg_local2, network_test_images_local_abstract_1, network_test_images_local_landscape [EXTRACTED 1.00]
- **Frontend Ad/Stock Photo Image Collection** — ad_images_abstract_art_1, ad_images_abstract_art_2, ad_images_abstract_art_3, ad_images_abstract_art_4, ad_images_abstract_art_5, ad_images_city_1, ad_images_fashion_style, ad_images_headphones, ad_images_landscape_1 [EXTRACTED 1.00]
- **Retail Interior Stock Photos** — ad_images_city_1, ad_images_fashion_style [INFERRED 0.85]
- **Nature Landscape Images** — network_test_images_local_landscape, network_test_images_google_webp_webp, ad_images_landscape_1 [INFERRED 0.75]
- **Ad Images Asset Collection** — adimages_landscape2_landscape_photo, adimages_luxurywatch_product_photo, adimages_nature1_nature_photo, adimages_people1_people_photo, adimages_perfume_product_photo, adimages_premiumproduct_product_photo, adimages_smartphone_product_photo, adimages_sneakers_product_photo, adimages_techdevice_product_photo, adimages_category_stock_ad_images [EXTRACTED 1.00]
- **SVG Templates Asset Collection** — svgtemplates_abstractgeometricart_template, svgtemplates_analyticsdashboard_template, svgtemplates_elegantdecorativeframe_template, svgtemplates_goldmedalbadge_template, svgtemplates_category_svg_templates [EXTRACTED 1.00]
- **Social Media and Brand Icons** — public_iconssvg_bluesky_icon, public_iconssvg_discord_icon, public_iconssvg_github_icon, public_iconssvg_social_icon, public_iconssvg_x_icon, public_iconssvg_social_icon_sprite [EXTRACTED 1.00]
- **Product Photography Images** — adimages_luxurywatch_product_photo, adimages_perfume_product_photo, adimages_premiumproduct_product_photo, adimages_smartphone_product_photo, adimages_sneakers_product_photo, adimages_techdevice_product_photo [INFERRED 0.85]
- **Nature and Lifestyle Photography** — adimages_landscape2_landscape_photo, adimages_nature1_nature_photo, adimages_people1_people_photo [INFERRED 0.85]
- **Decorative Design Templates** — svgtemplates_elegantdecorativeframe_template, svgtemplates_goldmedalbadge_template [INFERRED 0.85]
- **Data Visualization Templates** — svgtemplates_abstractgeometricart_template, svgtemplates_analyticsdashboard_template [INFERRED 0.85]
- **Chinese E-Commerce Promotion Templates** — svg_templates_jd_618_promo_poster, svg_templates_taobao_double_11_poster, svg_templates_premium_brand_poster, svg_templates_chinese_localization, svg_templates_ecommerce_template_category [INFERRED 0.95]
- **Social Media UI Templates** — svg_templates_instagram_post_template, svg_templates_social_profile_card, svg_templates_social_media_template_category [INFERRED 0.95]
- **Dark Theme UI Templates** — svg_templates_modern_dashboard_chart, svg_templates_music_player_ui, svg_templates_neon_lightning_bolt, svg_templates_dark_theme_ui [INFERRED 0.85]
- **Icon and Decorative Graphic Elements** — svg_templates_neon_lightning_bolt, svg_templates_premium_star_burst, svg_templates_icon_graphic_category [INFERRED 0.90]

## Communities (86 total, 22 thin omitted)

### Community 0 - "Asset Service Backend"
Cohesion: 0.06
Nodes (31): AssetMapper, AssetService, String, EditorAsset, List, Long, String, AssetListResponse (+23 more)

### Community 1 - "Frontend Asset Templates"
Cohesion: 0.06
Nodes (68): getAsset(), listAssets(), uploadAsset(), buildEditableTemplateFromImageLayer(), createPosterTemplateFromSource(), createScaledTextLayer(), getPrimaryTemplateTextLayerId(), getPrimaryTitleLayer() (+60 more)

### Community 2 - "Document Revision DTOs"
Cohesion: 0.05
Nodes (37): Integer, Long, String, AssetResponse, ApiResponse, CreateRevisionRequest, GetMapping, List (+29 more)

### Community 3 - "REST API Controllers"
Cohesion: 0.07
Nodes (44): ApiResponse, AssetListResponse, AssetResponse, BatchDeleteResult, CleanupResult, DeleteMapping, GetMapping, List (+36 more)

### Community 4 - "Document List UI"
Cohesion: 0.05
Nodes (44): Attr, String, CreateDocumentModal(), CreateDocumentModalProps, DocumentCard(), DocumentCardProps, DocumentItem, EmptyState() (+36 more)

### Community 5 - "Canvas Layer Renderer"
Cohesion: 0.08
Nodes (42): applyTextTransform(), ComplexSvgImage, EllipseComponent, getMeasureContext(), GroupComponent, ImageComponent, LayerRendererProps, LineComponent (+34 more)

### Community 6 - "Image Utils Testing"
Cohesion: 0.11
Nodes (7): BeforeAll, DisplayName, String, Test, ByteArrayOutputStream, LegacyImageUtils, ImageUtilsTest

### Community 7 - "Exception Handling"
Cohesion: 0.11
Nodes (25): String, String, ApiResponse, BusinessException, ResponseEntity, String, T, Void (+17 more)

### Community 8 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, @ant-design/icons, antd, axios, canvg, dompurify, immer, jspdf (+31 more)

### Community 9 - "AI Image Controller"
Cohesion: 0.10
Nodes (21): AiImageResponse, AiStatusResponse, ApiResponse, GetMapping, Integer, PostMapping, String, String (+13 more)

### Community 10 - "Document CRUD DTOs"
Cohesion: 0.15
Nodes (14): CreateDocumentRequest, DocumentDetailResponse, DocumentListResponse, DocumentUpdateResponse, EditorDocument, Long, MultipartFile, ObjectNode (+6 more)

### Community 11 - "Zustand Clipboard History"
Cohesion: 0.12
Nodes (30): GuideLine, ClipboardActions, ClipboardSlice, ClipboardState, createClipboardSlice(), SyncHistoryState, DocumentSlice, createDrawingSlice() (+22 more)

### Community 12 - "Startup Utility Scripts"
Cohesion: 0.06
Nodes (30): app_user Table, Auto-Save Debounce, DownloadGif, String, String, TestGif, String, TestRegex (+22 more)

### Community 13 - "Content Validation Testing"
Cohesion: 0.16
Nodes (10): ArrayNode, ObjectNode, String, BeforeEach, DisplayName, ObjectNode, Test, ContentValidator (+2 more)

### Community 14 - "Document Service Testing"
Cohesion: 0.12
Nodes (16): EditorDocument, Integer, List, Long, String, BeforeEach, DisplayName, EditorDocument (+8 more)

### Community 15 - "Image Dimension Parsing"
Cohesion: 0.19
Nodes (8): DataInputStream, Dimension, InputStream, Override, String, DataInput, Dimension, ImageUtils

### Community 16 - "Property Panel UI"
Cohesion: 0.07
Nodes (26): BLEND_MODES, CommonProperties, FillProperties, FilterProperties, FONT_FAMILIES, hasFillProp(), hasStrokeProp(), ImageHint (+18 more)

### Community 17 - "Test Image Fixtures"
Cohesion: 0.11
Nodes (16): Animated GIF, Static GIF, Image Dimension Parsing, GIF Format, JPEG Format, WebP Format, Autumn Forest Path Scene, Fjord Mountain Scene (+8 more)

### Community 18 - "AI Image API Client"
Cohesion: 0.07
Nodes (23): blobToBase64, createMaskFromStrokes, getAiStatus, inpaintingImage, mattingImage, outpaintingImage, superResolutionImage, listAssets (+15 more)

### Community 19 - "Keyboard Shortcuts Document"
Cohesion: 0.16
Nodes (22): ClipboardData, useKeyboardShortcuts(), createDocumentSlice(), DocumentActions, DocumentState, syncHistoryState(), finishDrawing, updateLayerPatch (+14 more)

### Community 20 - "Canvas Stage Components"
Cohesion: 0.11
Nodes (22): EditorStage(), extractTextLayers(), GridOverlay(), GridOverlayProps, LayerRenderer, useSmartGuideDrag(), SelectionTransformer(), calculateGuideLines() (+14 more)

### Community 21 - "SVG E-Commerce Templates"
Cohesion: 0.09
Nodes (27): Avatar Card Layout, Chinese Language Localization, Countdown Timer UI, Coupon Component, CTA Button Design, Cyan to Purple Gradient, E-Commerce Promotion Layout, E-Commerce Template (+19 more)

### Community 22 - "Editor Data Auto-Save"
Cohesion: 0.13
Nodes (17): AdImage, adImages, imageTemplates module, PresetShape, presetShapes, generateThumbnail(), useAutoSave(), useSelection() (+9 more)

### Community 23 - "AI Service Volcengine"
Cohesion: 0.18
Nodes (11): String, T, VolcengineResponse, ExecuteOperation Generic API Call Pattern, Common-to-AI Layering Violation, Function, InetAddress, AiImageService (+3 more)

### Community 24 - "Document API Client"
Cohesion: 0.11
Nodes (14): CreateDocumentRequest, DocumentListResponse, getDocument(), updateDocument(), UpdateDocumentRequest, UpdateTitleRequest, createRevision(), listRevisions() (+6 more)

### Community 25 - "Frontend Build Config"
Cohesion: 0.08
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib, module (+14 more)

### Community 26 - "Sketch File Parser"
Cohesion: 0.12
Nodes (23): blobToDataUrl(), buildPathFromPoints(), convertSketchLayer(), parseSketchFile(), parseSketchPoint(), parseTextAttributes(), SketchAttributedString, SketchBorder (+15 more)

### Community 27 - "Legacy Image Utils"
Cohesion: 0.20
Nodes (7): DataInputStream, Dimension, InputStream, Override, String, Dimension, LegacyImageUtils

### Community 28 - "Ad Image Collection"
Cohesion: 0.12
Nodes (19): Stock Ad Images Collection, Landscape-2 Photo, Nature Landscape Theme, Luxury Goods Theme, Luxury Watch Product Photo, Nature-1 Photo, Wilderness Nature Theme, Lifestyle People Theme (+11 more)

### Community 29 - "App Providers Config"
Cohesion: 0.16
Nodes (11): AppProviders(), queryClient, router, Bean, Client, CloseableHttpClient, HttpClientConfig, HttpClientProperties (+3 more)

### Community 30 - "Network Image Testing"
Cohesion: 0.22
Nodes (7): BeforeAll, DisplayName, String, Test, ImageUtils, NetworkImageTest, TestImage

### Community 31 - "OpenFeign Documentation"
Cohesion: 0.14
Nodes (19): OpenFeign Configuration Priority Source Analysis, contextId Configuration Matching, defaultToProperties, FeignClientFactoryBean, HttpClient5 Timeout Architecture, inheritParentContext, Configuration Merge Strategy, OpenFeign HttpClient5 Timeout and Connection Pool Guide (+11 more)

### Community 32 - "Volcengine Feign Config"
Cohesion: 0.20
Nodes (11): Bean, Override, String, VolcengineFeignConfig, VolcengineSignatureInterceptor, Collection, SSRF Protection via DNS Resolution, Volcengine HMAC-SHA256 Signature (+3 more)

### Community 33 - "Volcengine DTO Mapping"
Cohesion: 0.13
Nodes (9): String, VolcengineInpaintingRequest, VolcengineMattingRequest, VolcengineOutpaintingRequest, ErrorInfo, ResponseMetadata, ResultData, VolcengineResponse (+1 more)

### Community 34 - "Node Build Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 35 - "AI Image Frontend Utils"
Cohesion: 0.15
Nodes (16): AiImageResponse, AiStatusResponse, blobToBase64(), canvasToBase64(), createBlankCanvas(), createMaskFromStrokes(), getAiStatus(), inpaintingImage() (+8 more)

### Community 36 - "Layer Operations"
Cohesion: 0.29
Nodes (14): setDocument, cancelPendingLayerPatch(), addLayerToTree(), bringToFront(), findLayerById(), getLayerIndex(), getParentId(), moveLayerDown() (+6 more)

### Community 37 - "Abstract Art Images"
Cohesion: 0.14
Nodes (16): Abstract Art 1 - Mountain Biker in Forest, Extreme Sports / Mountain Biking, Abstract Art 2 - Modern Curved Library Interior, Modern Library Architecture, Abstract Art 3 - Forest Scene, Abstract Art 4 - Coastal Scene, Coastal Scene with Lighthouse, Abstract Art 5 (+8 more)

### Community 38 - "Icon Favicon Assets"
Cohesion: 0.14
Nodes (16): Application Favicon, Lightning Bolt Motif, Purple Brand Color, Geometric Shapes Composition, Gradient Color Palette, Abstract Geometric Art Template, Dark Theme UI Design, Data Visualization Design (+8 more)

### Community 39 - "Security Configuration"
Cohesion: 0.21
Nodes (8): Bean, Long, HttpSecurity, PasswordEncoder, SecurityConfig, UserContext, SecurityFilterChain, UserDetailsService

### Community 40 - "File Parsing Utils"
Cohesion: 0.22
Nodes (15): detectFileType, parseDesignFile, parseSvgFile, generateId, createLayerFromLocalImage, createPosterTemplateFromSource, convertSketchLayer, parseSketchFile (+7 more)

### Community 41 - "Volcengine Visual Client"
Cohesion: 0.35
Nodes (8): PostMapping, String, VolcengineResponse, VolcengineVisualClient, VolcengineInpaintingRequest, VolcengineMattingRequest, VolcengineOutpaintingRequest, VolcengineSuperResolutionRequest

### Community 42 - "Export Image Utils"
Cohesion: 0.31
Nodes (12): buildSVGFromLayers(), calculateContentBounds(), calculateSelectedBounds(), downloadBlob(), escapeXML(), ExportFormat, ExportResolution, generatePolygonPoints() (+4 more)

### Community 43 - "Startup Shell Scripts"
Cohesion: 0.27
Nodes (8): start.sh script, check_frontend_deps(), check_java(), check_postgres(), main(), setup_database(), start_backend(), start_frontend()

### Community 44 - "Snapping Utilities"
Cohesion: 0.26
Nodes (9): BoundingBox, shouldSnapToGrid(), snapLayerToGrid(), snapPosition(), SnapResult, snapToEqualSpacing(), snapToGrid(), snapToLayers() (+1 more)

### Community 45 - "Network Test Images"
Cohesion: 0.22
Nodes (11): Dynamic Range Test, Network Test Image, WebP Image Format, Waterfall with Rainbow Scene, Google WebP Test Image, JPEG Local Test Image 1, JPEG Local Test Image 2, Abstract Forest Path with Autumn Leaves (+3 more)

### Community 46 - "Kong Access Log"
Cohesion: 0.43
Nodes (8): Five-Segment Breakdown, Kong Access Log Four Metrics Guide, rt (request_time), TCP Retransmission Pattern, uct (upstream_connect_time), uht (upstream_header_time), urt (upstream_response_time), Kong Diagnose Prompt for Gemini

### Community 47 - "Layer Tree Operations"
Cohesion: 0.54
Nodes (8): bringToFront, findLayerById, getLayerIndex, getParentId, moveLayerDown, moveLayerUp, sendToBack, updateLayerInTree

### Community 48 - "Dashboard Music Templates"
Cohesion: 0.25
Nodes (8): Bar Chart Visualization, Dark Theme UI, Dashboard Template, Media Player Controls, Modern Dashboard Chart, Music Player UI, Progress Bar Component, Trend Line Chart

### Community 49 - "Social Media Icons"
Cohesion: 0.29
Nodes (7): Bluesky Icon, Discord Icon, Documentation Icon, GitHub Icon, Social Person Icon, Social Media Icon Sprite, X (Twitter) Icon

### Community 50 - "Web MVC Config"
Cohesion: 0.47
Nodes (4): Override, WebConfig, ResourceHandlerRegistry, WebMvcConfigurer

### Community 51 - "Google Fonts Loader"
Cohesion: 0.40
Nodes (4): GOOGLE_FONT_NAMES, loadedFonts, loadGoogleFonts(), preloadCommonFonts()

### Community 52 - "AI Processing Concepts"
Cohesion: 0.40
Nodes (5): AI Image Processing, Graceful AI Degradation, OpenFeign HttpClient5 Integration, SSRF Protection, Volcengine Visual API

### Community 58 - "DevOps Startup"
Cohesion: 0.67
Nodes (4): Docker PostgreSQL Setup, Flyway Database Migration, One-Click Startup Script, Spring Profile Multi-Environment

### Community 59 - "Financial AI Docs"
Cohesion: 0.67
Nodes (4): Financial Industry AI Agent Analysis, Audit Trail, NL2SQL in Finance, Private Deployment

### Community 60 - "RateLimiter Documentation"
Cohesion: 0.50
Nodes (4): RateLimiter Class, Duration vs TimeUnit, ReentrantLock Usage, RateLimiter Sliding Window Guide

### Community 61 - "Grayscale Release Docs"
Cohesion: 1.00
Nodes (3): Grayscale Release Challenges, Schema Compatibility Strategy, Traffic Coloring

### Community 62 - "PG Partition Index Docs"
Cohesion: 1.00
Nodes (3): PostgreSQL Partition Index Guide, CONCURRENTLY on Partitions, Partition Index Inheritance

### Community 63 - "Document Mutation APIs"
Cohesion: 0.67
Nodes (3): createDocument, importDocumentFromFile, updateDocument

### Community 65 - "LayerRenderer Concepts"
Cohesion: 1.00
Nodes (3): LayerRenderer Component, 9-Type Layer System, SVG Ungroup Decomposition

### Community 66 - "Snap Algorithms"
Cohesion: 0.67
Nodes (3): snapPosition, snapToEqualSpacing, snapToLayers

## Knowledge Gaps
- **365 isolated node(s):** `String`, `String`, `String`, `String`, `Override` (+360 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `EditorLayer` connect `Canvas Layer Renderer` to `Frontend Asset Templates`, `Layer Operations`, `Document List UI`, `File Parsing Utils`, `Export Image Utils`, `Zustand Clipboard History`, `Layer Tree Operations`, `Property Panel UI`, `Keyboard Shortcuts Document`, `Canvas Stage Components`, `Editor Data Auto-Save`, `Sketch File Parser`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `DocumentTemplate` connect `Document List UI` to `Canvas Layer Renderer`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useEditorStore` (e.g. with `EditorPage()` and `useImageAsset()`) actually correct?**
  _`useEditorStore` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 28 inferred relationships involving `ok()` (e.g. with `.buildSuccessResponse()` and `.status()`) actually correct?**
  _`ok()` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `AiImageService` (e.g. with `AssetController` and `Common-to-AI Layering Violation`) actually correct?**
  _`AiImageService` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `String`, `String`, `String` to the rest of the system?**
  _375 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Asset Service Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.055822466254861584 - nodes in this community are weakly interconnected._