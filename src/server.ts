/**
 * GoHighLevel MCP Server - Remote Version
 * Main entry point for the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { GHLApiClient } from './clients/ghl-api-client';
import { ContactTools } from './tools/contact-tools.js';
import { ConversationTools } from './tools/conversation-tools.js';
import { BlogTools } from './tools/blog-tools.js';
import { OpportunityTools } from './tools/opportunity-tools.js';
import { CalendarTools } from './tools/calendar-tools.js';
import { EmailTools } from './tools/email-tools.js';
import { LocationTools } from './tools/location-tools.js';
import { EmailISVTools } from './tools/email-isv-tools.js';
import { SocialMediaTools } from './tools/social-media-tools.js';
import { MediaTools } from './tools/media-tools.js';
import { ObjectTools } from './tools/object-tools.js';
import { AssociationTools } from './tools/association-tools.js';
import { CustomFieldV2Tools } from './tools/custom-field-v2-tools.js';
import { WorkflowTools } from './tools/workflow-tools.js';
import { SurveyTools } from './tools/survey-tools.js';
import { StoreTools } from './tools/store-tools.js';
import { GHLConfig } from './types/ghl-types';
import { ProductsTools } from './tools/products-tools.js';
import { PaymentsTools } from './tools/payments-tools.js';
import { InvoicesTools } from './tools/invoices-tools.js';

// Load environment variables
dotenv.config();

/**
 * Main MCP Server class - Remote Version
 */
class GHLMCPServer {
  private server: Server;
  private app: express.Application;
  private ghlClient: GHLApiClient;
  private contactTools: ContactTools;
  private conversationTools: ConversationTools;
  private blogTools: BlogTools;
  private opportunityTools: OpportunityTools;
  private calendarTools: CalendarTools;
  private emailTools: EmailTools;
  private locationTools: LocationTools;
  private emailISVTools: EmailISVTools;
  private socialMediaTools: SocialMediaTools;
  private mediaTools: MediaTools;
  private objectTools: ObjectTools;
  private associationTools: AssociationTools;
  private customFieldV2Tools: CustomFieldV2Tools;
  private workflowTools: WorkflowTools;
  private surveyTools: SurveyTools;
  private storeTools: StoreTools;
  private productsTools: ProductsTools;
  private paymentsTools: PaymentsTools;
  private invoicesTools: InvoicesTools;

  constructor() {
    // Initialize Express app
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    // Initialize MCP server with capabilities
    this.server = new Server(
      {
        name: 'ghl-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize GHL API client
    this.ghlClient = this.initializeGHLClient();
    
    // Initialize tools
    this.contactTools = new ContactTools(this.ghlClient);
    this.conversationTools = new ConversationTools(this.ghlClient);
    this.blogTools = new BlogTools(this.ghlClient);
    this.opportunityTools = new OpportunityTools(this.ghlClient);
    this.calendarTools = new CalendarTools(this.ghlClient);
    this.emailTools = new EmailTools(this.ghlClient);
    this.locationTools = new LocationTools(this.ghlClient);
    this.emailISVTools = new EmailISVTools(this.ghlClient);
    this.socialMediaTools = new SocialMediaTools(this.ghlClient);
    this.mediaTools = new MediaTools(this.ghlClient);
    this.objectTools = new ObjectTools(this.ghlClient);
    this.associationTools = new AssociationTools(this.ghlClient);
    this.customFieldV2Tools = new CustomFieldV2Tools(this.ghlClient);
    this.workflowTools = new WorkflowTools(this.ghlClient);
    this.surveyTools = new SurveyTools(this.ghlClient);
    this.storeTools = new StoreTools(this.ghlClient);
    this.productsTools = new ProductsTools(this.ghlClient);
    this.paymentsTools = new PaymentsTools(this.ghlClient);
    this.invoicesTools = new InvoicesTools(this.ghlClient);

    // Setup MCP handlers and HTTP routes
    this.setupHandlers();
    this.setupHttpRoutes();
  }

  /**
   * Initialize GoHighLevel API client with configuration
   */
  private initializeGHLClient(): GHLApiClient {
    // Load configuration from environment
    const config: GHLConfig = {
      accessToken: process.env.GHL_API_KEY || '',
      baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
      version: '2021-07-28',
      locationId: process.env.GHL_LOCATION_ID || ''
    };

    // Validate required configuration
    if (!config.accessToken) {
      throw new Error('GHL_API_KEY environment variable is required');
    }

    if (!config.locationId) {
      throw new Error('GHL_LOCATION_ID environment variable is required');
    }

    process.stderr.write('[GHL MCP] Initializing GHL API client...\n');
    process.stderr.write(`[GHL MCP] Base URL: ${config.baseUrl}\n`);
    process.stderr.write(`[GHL MCP] Version: ${config.version}\n`);
    process.stderr.write(`[GHL MCP] Location ID: ${config.locationId}\n`);

    return new GHLApiClient(config);
  }

  /**
   * Setup HTTP routes for remote MCP access
   */
  private setupHttpRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        server: 'ghl-mcp-server', 
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'GoHighLevel MCP Server',
        version: '1.0.0',
        description: 'Remote Model Context Protocol server for GoHighLevel integration',
        endpoints: {
          health: '/health',
          sse: '/sse',
          tools: '/api/tools'
        }
      });
    });

    // MCP SSE endpoint for remote connections
    this.app.get('/sse', async (req, res) => {
      process.stderr.write('[GHL MCP] New SSE connection established\n');
      
      try {
        const transport = new SSEServerTransport('/sse', res);
        await this.server.connect(transport);
      } catch (error) {
        console.error('[GHL MCP] SSE connection error:', error);
        res.status(500).json({ error: 'Failed to establish SSE connection' });
      }
    });

    // List available tools endpoint
    this.app.get('/api/tools', async (req, res) => {
      try {
        const contactToolDefinitions = this.contactTools.getToolDefinitions();
        const conversationToolDefinitions = this.conversationTools.getToolDefinitions();
        const blogToolDefinitions = this.blogTools.getToolDefinitions();
        const opportunityToolDefinitions = this.opportunityTools.getToolDefinitions();
        const calendarToolDefinitions = this.calendarTools.getToolDefinitions();
        const emailToolDefinitions = this.emailTools.getToolDefinitions();
        const locationToolDefinitions = this.locationTools.getToolDefinitions();
        const emailISVToolDefinitions = this.emailISVTools.getToolDefinitions();
        const socialMediaToolDefinitions = this.socialMediaTools.getTools();
        const mediaToolDefinitions = this.mediaTools.getToolDefinitions();
        const objectToolDefinitions = this.objectTools.getToolDefinitions();
        const associationToolDefinitions = this.associationTools.getTools();
        const customFieldV2ToolDefinitions = this.customFieldV2Tools.getTools();
        const workflowToolDefinitions = this.workflowTools.getTools();
        const surveyToolDefinitions = this.surveyTools.getTools();
        const storeToolDefinitions = this.storeTools.getTools();
        const productsToolDefinitions = this.productsTools.getTools();
        const paymentsToolDefinitions = this.paymentsTools.getTools();
        const invoicesToolDefinitions = this.invoicesTools.getTools();
        
        const allTools = [
          ...contactToolDefinitions,
          ...conversationToolDefinitions,
          ...blogToolDefinitions,
          ...opportunityToolDefinitions,
          ...calendarToolDefinitions,
          ...emailToolDefinitions,
          ...locationToolDefinitions,
          ...emailISVToolDefinitions,
          ...socialMediaToolDefinitions,
          ...mediaToolDefinitions,
          ...objectToolDefinitions,
          ...associationToolDefinitions,
          ...customFieldV2ToolDefinitions,
          ...workflowToolDefinitions,
          ...surveyToolDefinitions,
          ...storeToolDefinitions,
          ...productsToolDefinitions,
          ...paymentsToolDefinitions,
          ...invoicesToolDefinitions
        ];
        
        res.json({ 
          success: true, 
          tools: allTools,
          count: allTools.length,
          categories: {
            contact: contactToolDefinitions.length,
            conversation: conversationToolDefinitions.length,
            blog: blogToolDefinitions.length,
            opportunity: opportunityToolDefinitions.length,
            calendar: calendarToolDefinitions.length,
            email: emailToolDefinitions.length,
            location: locationToolDefinitions.length,
            emailISV: emailISVToolDefinitions.length,
            socialMedia: socialMediaToolDefinitions.length,
            media: mediaToolDefinitions.length,
            object: objectToolDefinitions.length,
            association: associationToolDefinitions.length,
            customFieldV2: customFieldV2ToolDefinitions.length,
            workflow: workflowToolDefinitions.length,
            survey: surveyToolDefinitions.length,
            store: storeToolDefinitions.length,
            products: productsToolDefinitions.length,
            payments: paymentsToolDefinitions.length,
            invoices: invoicesToolDefinitions.length
          }
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // Handle list tools requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      process.stderr.write('[GHL MCP] Listing available tools...\n');
      
      try {
        const contactToolDefinitions = this.contactTools.getToolDefinitions();
        const conversationToolDefinitions = this.conversationTools.getToolDefinitions();
        const blogToolDefinitions = this.blogTools.getToolDefinitions();
        const opportunityToolDefinitions = this.opportunityTools.getToolDefinitions();
        const calendarToolDefinitions = this.calendarTools.getToolDefinitions();
        const emailToolDefinitions = this.emailTools.getToolDefinitions();
        const locationToolDefinitions = this.locationTools.getToolDefinitions();
        const emailISVToolDefinitions = this.emailISVTools.getToolDefinitions();
        const socialMediaToolDefinitions = this.socialMediaTools.getTools();
        const mediaToolDefinitions = this.mediaTools.getToolDefinitions();
        const objectToolDefinitions = this.objectTools.getToolDefinitions();
        const associationToolDefinitions = this.associationTools.getTools();
        const customFieldV2ToolDefinitions = this.customFieldV2Tools.getTools();
        const workflowToolDefinitions = this.workflowTools.getTools();
        const surveyToolDefinitions = this.surveyTools.getTools();
        const storeToolDefinitions = this.storeTools.getTools();
        const productsToolDefinitions = this.productsTools.getTools();
        const paymentsToolDefinitions = this.paymentsTools.getTools();
        const invoicesToolDefinitions = this.invoicesTools.getTools();
        
        const allTools = [
          ...contactToolDefinitions,
          ...conversationToolDefinitions,
          ...blogToolDefinitions,
          ...opportunityToolDefinitions,
          ...calendarToolDefinitions,
          ...emailToolDefinitions,
          ...locationToolDefinitions,
          ...emailISVToolDefinitions,
          ...socialMediaToolDefinitions,
          ...mediaToolDefinitions,
          ...objectToolDefinitions,
          ...associationToolDefinitions,
          ...customFieldV2ToolDefinitions,
          ...workflowToolDefinitions,
          ...surveyToolDefinitions,
          ...storeToolDefinitions,
          ...productsToolDefinitions,
          ...paymentsToolDefinitions,
          ...invoicesToolDefinitions
        ];
        
        process.stderr.write(`[GHL MCP] Registered ${allTools.length} tools total\n`);
        
        return {
          tools: allTools
        };
      } catch (error) {
        console.error('[GHL MCP] Error listing tools:', error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to list tools: ${error}`
        );
      }
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      process.stderr.write(`[GHL MCP] Executing tool: ${name}\n`);

      try {
        let result: any;

        // Route to appropriate tool handler
        if (this.isContactTool(name)) {
          result = await this.contactTools.executeTool(name, args || {});
        } else if (this.isConversationTool(name)) {
          result = await this.conversationTools.executeTool(name, args || {});
        } else if (this.isBlogTool(name)) {
          result = await this.blogTools.executeTool(name, args || {});
        } else if (this.isOpportunityTool(name)) {
          result = await this.opportunityTools.executeTool(name, args || {});
        } else if (this.isCalendarTool(name)) {
          result = await this.calendarTools.executeTool(name, args || {});
        } else if (this.isEmailTool(name)) {
          result = await this.emailTools.executeTool(name, args || {});
        } else if (this.isLocationTool(name)) {
          result = await this.locationTools.executeTool(name, args || {});
        } else if (this.isEmailISVTool(name)) {
          result = await this.emailISVTools.executeTool(name, args || {});
        } else if (this.isSocialMediaTool(name)) {
          result = await this.socialMediaTools.executeTool(name, args || {});
        } else if (this.isMediaTool(name)) {
          result = await this.mediaTools.executeTool(name, args || {});
        } else if (this.isObjectTool(name)) {
          result = await this.objectTools.executeTool(name, args || {});
        } else if (this.isAssociationTool(name)) {
          result = await this.associationTools.executeAssociationTool(name, args || {});
        } else if (this.isCustomFieldV2Tool(name)) {
          result = await this.customFieldV2Tools.executeCustomFieldV2Tool(name, args || {});
        } else if (this.isWorkflowTool(name)) {
          result = await this.workflowTools.executeWorkflowTool(name, args || {});
        } else if (this.isSurveyTool(name)) {
          result = await this.surveyTools.executeSurveyTool(name, args || {});
        } else if (this.isStoreTool(name)) {
          result = await this.storeTools.executeStoreTool(name, args || {});
        } else if (this.isProductsTool(name)) {
          result = await this.productsTools.executeProductsTool(name, args || {});
        } else if (this.isPaymentsTool(name)) {
          result = await this.paymentsTools.handleToolCall(name, args || {});
        } else if (this.isInvoicesTool(name)) {
          result = await this.invoicesTools.handleToolCall(name, args || {});
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
        
        process.stderr.write(`[GHL MCP] Tool ${name} executed successfully\n`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(`[GHL MCP] Error executing tool ${name}:`, error);
        
        // Determine appropriate error code
        const errorCode = error instanceof Error && error.message.includes('404') 
          ? ErrorCode.InvalidRequest 
          : ErrorCode.InternalError;
        
        throw new McpError(
          errorCode,
          `Tool execution failed: ${error}`
        );
      }
    });

    process.stderr.write('[GHL MCP] Request handlers setup complete\n');
  }

  // Keep all your existing tool checking methods exactly as they are
  private isContactTool(toolName: string): boolean {
    const contactToolNames = [
      'create_contact', 'search_contacts', 'get_contact', 'update_contact',
      'add_contact_tags', 'remove_contact_tags', 'delete_contact',
      'get_contact_tasks', 'create_contact_task', 'get_contact_task', 'update_contact_task',
      'delete_contact_task', 'update_task_completion',
      'get_contact_notes', 'create_contact_note', 'get_contact_note', 'update_contact_note',
      'delete_contact_note',
      'upsert_contact', 'get_duplicate_contact', 'get_contacts_by_business', 'get_contact_appointments',
      'bulk_update_contact_tags', 'bulk_update_contact_business',
      'add_contact_followers', 'remove_contact_followers',
      'add_contact_to_campaign', 'remove_contact_from_campaign', 'remove_contact_from_all_campaigns',
      'add_contact_to_workflow', 'remove_contact_from_workflow'
    ];
    return contactToolNames.includes(toolName);
  }

  private isConversationTool(toolName: string): boolean {
    const conversationToolNames = [
      'send_sms', 'send_email', 'search_conversations', 'get_conversation',
      'create_conversation', 'update_conversation', 'delete_conversation', 'get_recent_messages',
      'get_email_message', 'get_message', 'upload_message_attachments', 'update_message_status',
      'add_inbound_message', 'add_outbound_call',
      'get_message_recording', 'get_message_transcription', 'download_transcription',
      'cancel_scheduled_message', 'cancel_scheduled_email',
      'live_chat_typing'
    ];
    return conversationToolNames.includes(toolName);
  }

  private isBlogTool(toolName: string): boolean {
    const blogToolNames = [
      'create_blog_post', 'update_blog_post', 'get_blog_posts', 'get_blog_sites',
      'get_blog_authors', 'get_blog_categories', 'check_url_slug'
    ];
    return blogToolNames.includes(toolName);
  }

  private isOpportunityTool(toolName: string): boolean {
    const opportunityToolNames = [
      'search_opportunities', 'get_pipelines', 'get_opportunity', 'create_opportunity',
      'update_opportunity_status', 'delete_opportunity', 'update_opportunity', 
      'upsert_opportunity', 'add_opportunity_followers', 'remove_opportunity_followers'
    ];
    return opportunityToolNames.includes(toolName);
  }

  private isCalendarTool(toolName: string): boolean {
    const calendarToolNames = [
      'get_calendar_groups', 'get_calendars', 'create_calendar', 'get_calendar', 'update_calendar', 
      'delete_calendar', 'get_calendar_events', 'get_free_slots', 'create_appointment', 
      'get_appointment', 'update_appointment', 'delete_appointment', 'create_block_slot', 'update_block_slot'
    ];
    return calendarToolNames.includes(toolName);
  }

  private isEmailTool(toolName: string): boolean {
    const emailToolNames = [
      'get_email_campaigns', 'create_email_template', 'get_email_templates', 
      'update_email_template', 'delete_email_template'
    ];
    return emailToolNames.includes(toolName);
  }

  private isLocationTool(toolName: string): boolean {
    const locationToolNames = [
      'search_locations', 'get_location', 'create_location', 'update_location', 'delete_location',
      'get_location_tags', 'create_location_tag', 'get_location_tag', 'update_location_tag', 'delete_location_tag',
      'search_location_tasks',
      'get_location_custom_fields', 'create_location_custom_field', 'get_location_custom_field', 
      'update_location_custom_field', 'delete_location_custom_field',
      'get_location_custom_values', 'create_location_custom_value', 'get_location_custom_value',
      'update_location_custom_value', 'delete_location_custom_value',
      'get_location_templates', 'delete_location_template',
      'get_timezones'
    ];
    return locationToolNames.includes(toolName);
  }

  private isEmailISVTool(toolName: string): boolean {
    const emailISVToolNames = ['verify_email'];
    return emailISVToolNames.includes(toolName);
  }

  private isSocialMediaTool(toolName: string): boolean {
    const socialMediaToolNames = [
      'search_social_posts', 'create_social_post', 'get_social_post', 'update_social_post',
      'delete_social_post', 'bulk_delete_social_posts',
      'get_social_accounts', 'delete_social_account',
      'upload_social_csv', 'get_csv_upload_status', 'set_csv_accounts',
      'get_social_categories', 'get_social_category', 'get_social_tags', 'get_social_tags_by_ids',
      'start_social_oauth', 'get_platform_accounts'
    ];
    return socialMediaToolNames.includes(toolName);
  }

  private isMediaTool(toolName: string): boolean {
    const mediaToolNames = ['get_media_files', 'upload_media_file', 'delete_media_file'];
    return mediaToolNames.includes(toolName);
  }

  private isObjectTool(toolName: string): boolean {
    const objectToolNames = [
      'get_all_objects', 'create_object_schema', 'get_object_schema', 'update_object_schema',
      'create_object_record', 'get_object_record', 'update_object_record', 'delete_object_record',
      'search_object_records'
    ];
    return objectToolNames.includes(toolName);
  }

  private isAssociationTool(toolName: string): boolean {
    const associationToolNames = [
      'ghl_get_all_associations', 'ghl_create_association', 'ghl_get_association_by_id',
      'ghl_update_association', 'ghl_delete_association', 'ghl_get_association_by_key',
      'ghl_get_association_by_object_key', 'ghl_create_relation', 'ghl_get_relations_by_record',
      'ghl_delete_relation'
    ];
    return associationToolNames.includes(toolName);
  }

  private isCustomFieldV2Tool(toolName: string): boolean {
    const customFieldV2ToolNames = [
      'ghl_get_custom_field_by_id', 'ghl_create_custom_field', 'ghl_update_custom_field',
      'ghl_delete_custom_field', 'ghl_get_custom_fields_by_object_key', 'ghl_create_custom_field_folder',
      'ghl_update_custom_field_folder', 'ghl_delete_custom_field_folder'
    ];
    return customFieldV2ToolNames.includes(toolName);
  }

  private isWorkflowTool(toolName: string): boolean {
    const workflowToolNames = ['ghl_get_workflows'];
    return workflowToolNames.includes(toolName);
  }

  private isSurveyTool(toolName: string): boolean {
    const surveyToolNames = ['ghl_get_surveys', 'ghl_get_survey_submissions'];
    return surveyToolNames.includes(toolName);
  }

  private isStoreTool(toolName: string): boolean {
    const storeToolNames = [
      'ghl_create_shipping_zone', 'ghl_list_shipping_zones', 'ghl_get_shipping_zone',
      'ghl_update_shipping_zone', 'ghl_delete_shipping_zone',
      'ghl_get_available_shipping_rates', 'ghl_create_shipping_rate', 'ghl_list_shipping_rates',
      'ghl_get_shipping_rate', 'ghl_update_shipping_rate', 'ghl_delete_shipping_rate',
      'ghl_create_shipping_carrier', 'ghl_list_shipping_carriers', 'ghl_get_shipping_carrier',
      'ghl_update_shipping_carrier', 'ghl_delete_shipping_carrier',
      'ghl_create_store_setting', 'ghl_get_store_setting'
    ];
    return storeToolNames.includes(toolName);
  }

  private isProductsTool(toolName: string): boolean {
    const productsToolNames = [
      'ghl_create_product', 'ghl_list_products', 'ghl_get_product', 'ghl_update_product',
      'ghl_delete_product', 'ghl_create_price', 'ghl_list_prices', 'ghl_list_inventory',
      'ghl_create_product_collection', 'ghl_list_product_collections'
    ];
    return productsToolNames.includes(toolName);
  }

  private isPaymentsTool(toolName: string): boolean {
    const paymentsToolNames = [
      'create_whitelabel_integration_provider', 'list_whitelabel_integration_providers',
      'list_orders', 'get_order_by_id',
      'create_order_fulfillment', 'list_order_fulfillments',
      'list_transactions', 'get_transaction_by_id',
      'list_subscriptions', 'get_subscription_by_id',
      'list_coupons', 'create_coupon', 'update_coupon', 'delete_coupon', 'get_coupon',
      'create_custom_provider_integration', 'delete_custom_provider_integration',
      'get_custom_provider_config', 'create_custom_provider_config', 'disconnect_custom_provider_config'
    ];
    return paymentsToolNames.includes(toolName);
  }

  private isInvoicesTool(toolName: string): boolean {
    const invoicesToolNames = [
      'create_invoice_template', 'list_invoice_templates', 'get_invoice_template', 'update_invoice_template', 'delete_invoice_template',
      'update_invoice_template_late_fees', 'update_invoice_template_payment_methods',
      'create_invoice_schedule', 'list_invoice_schedules', 'get_invoice_schedule', 'update_invoice_schedule', 'delete_invoice_schedule',
      'schedule_invoice_schedule', 'auto_payment_invoice_schedule', 'cancel_invoice_schedule',
      'create_invoice', 'list_invoices', 'get_invoice', 'update_invoice', 'delete_invoice', 'void_invoice', 'send_invoice',
      'record_invoice_payment', 'generate_invoice_number', 'text2pay_invoice', 'update_invoice_last_visited',
      'create_estimate', 'list_estimates', 'update_estimate', 'delete_estimate', 'send_estimate', 'create_invoice_from_estimate',
      'generate_estimate_number', 'update_estimate_last_visited',
      'list_estimate_templates', 'create_estimate_template', 'update_estimate_template', 'delete_estimate_template', 'preview_estimate_template'
    ];
    return invoicesToolNames.includes(toolName);
  }

  /**
   * Test GHL API connection
   */
  private async testGHLConnection(): Promise<void> {
    try {
      process.stderr.write('[GHL MCP] Testing GHL API connection...\n');
      
      const result = await this.ghlClient.testConnection();
      
      process.stderr.write('[GHL MCP] ✅ GHL API connection successful\n');
      process.stderr.write(`[GHL MCP] Connected to location: ${result.data?.locationId}\n`);
    } catch (error) {
      console.error('[GHL MCP] ❌ GHL API connection failed:', error);
      throw new Error(`Failed to connect to GHL API: ${error}`);
    }
  }

  /**
   * Initialize and start the remote MCP server
   */
  async start(): Promise<void> {
    const PORT = process.env.PORT || 8000;
    
    process.stderr.write('🚀 Starting Remote GoHighLevel MCP Server...\n');
    process.stderr.write('==========================================\n');
    
    try {
      // Test GHL API connection
      await this.testGHLConnection();
      
      // Start HTTP server
      this.app.listen(PORT, '0.0.0.0', () => {
        process.stderr.write(`✅ Remote GHL MCP Server started successfully!\n`);
        process.stderr.write(`🌐 HTTP Server listening on port ${PORT}\n`);
        process.stderr.write(`🔗 MCP SSE endpoint: /sse\n`);
        process.stderr.write(`📡 REST API available at: /api\n`);
        process.stderr.write(`❤️  Health check: /health\n`);
        process.stderr.write('==========================================\n');
        
        // Tool summary
        const allToolCounts = this.getAllToolCounts();
        process.stderr.write(`📋 Available tools: ${allToolCounts.total}\n`);
        process.stderr.write('==========================================\n');
      });
      
    } catch (error) {
      console.error('❌ Failed to start Remote GHL MCP Server:', error);
      process.exit(1);
    }
  }

  private getAllToolCounts() {
    const contactToolCount = this.contactTools.getToolDefinitions().length;
    const conversationToolCount = this.conversationTools.getToolDefinitions().length;
    const blogToolCount = this.blogTools.getToolDefinitions().length;
    const opportunityToolCount = this.opportunityTools.getToolDefinitions().length;
    const calendarToolCount = this.calendarTools.getToolDefinitions().length;
    const emailToolCount = this.emailTools.getToolDefinitions().length;
    const locationToolCount = this.locationTools.getToolDefinitions().length;
    const emailISVToolCount = this.emailISVTools.getToolDefinitions().length;
    const socialMediaToolCount = this.socialMediaTools.getTools().length;
    const mediaToolCount = this.mediaTools.getToolDefinitions().length;
    const objectToolCount = this.objectTools.getToolDefinitions().length;
    const associationToolCount = this.associationTools.getTools().length;
    const customFieldV2ToolCount = this.customFieldV2Tools.getTools().length;
    const workflowToolCount = this.workflowTools.getTools().length;
    const surveyToolCount = this.surveyTools.getTools().length;
    const storeToolCount = this.storeTools.getTools().length;
    const productsToolCount = this.productsTools.getTools().length;
    const paymentsToolCount = this.paymentsTools.getTools().length;
    const invoicesToolCount = this.invoicesTools.getTools().length;
    
    return {
      total: contactToolCount + conversationToolCount + blogToolCount + opportunityToolCount + 
             calendarToolCount + emailToolCount + locationToolCount + emailISVToolCount + 
             socialMediaToolCount + mediaToolCount + objectToolCount + associationToolCount + 
             customFieldV2ToolCount + workflowToolCount + surveyToolCount + storeToolCount + 
             productsToolCount + paymentsToolCount + invoicesToolCount,
      contact: contactToolCount,
      conversation: conversationToolCount,
      blog: blogToolCount,
      opportunity: opportunityToolCount,
      calendar: calendarToolCount,
      email: emailToolCount,
      location: locationToolCount,
      emailISV: emailISVToolCount,
      socialMedia: socialMediaToolCount,
      media: mediaToolCount,
      object: objectToolCount,
      association: associationToolCount,
      customFieldV2: customFieldV2ToolCount,
      workflow: workflowToolCount,
      survey: surveyToolCount,
      store: storeToolCount,
      products: productsToolCount,
      payments: paymentsToolCount,
      invoices: invoicesToolCount
    };
  }
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    process.stderr.write(`\n[GHL MCP] Received ${signal}, shutting down gracefully...\n`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Create and start server
    const server = new GHLMCPServer();
    await server.start();
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
