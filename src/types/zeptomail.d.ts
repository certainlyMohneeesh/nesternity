// Type declarations for zeptomail package
// The package has types but exports configuration doesn't properly expose them

declare module 'zeptomail' {
  export interface ClientParams {
    url: string;
    debug?: boolean | undefined;
    domain?: string;
    token: string;
  }

  interface EmailAddress {
    address: string;
    name: string;
  }

  interface CcBccItem {
    email_address: EmailAddress;
  }

  interface MimeHeader {
    [key: string]: string;
  }

  interface BasicEmailParams {
    from: {
      address: string;
      name?: string;
    };
    subject: string;
    reply_to?: EmailAddress[];
    textbody?: string;
    htmlbody?: string;
    cc?: CcBccItem[];
    bcc?: CcBccItem[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: MimeHeader;
    attachments?: Array<{
      name: string;
      mime_type?: string;
      file_cache_key?: string;
      content?: string;
    }>;
    inline_images?: Array<{
      cid: string;
      mime_type?: string;
      file_cache_key?: string;
      content?: string;
    }>;
    merge_info?: {
      [key: string]: string;
    };
  }

  export interface Sendmail extends BasicEmailParams {
    to: CcBccItem[];
  }

  export interface SendmailBatch extends BasicEmailParams {
    to: Array<{
      email_address: EmailAddress;
      merge_info?: {
        [key: string]: string;
      };
    }>;
  }

  interface TemplateBasicParams {
    from: {
      address: string;
      name?: string;
    };
    mail_template_key?: string;
    template_alias?: string;
    template_key?: string;
    reply_to?: EmailAddress[];
    cc?: CcBccItem[];
    bcc?: CcBccItem[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: MimeHeader;
    merge_info?: {
      [key: string]: string;
    };
  }

  export interface TemplateQueryParams extends TemplateBasicParams {
    to: CcBccItem[];
  }

  export interface TemplateBatchParams extends TemplateBasicParams {
    to: Array<{
      email_address: EmailAddress;
      merge_info?: {
        [key: string]: string;
      };
    }>;
  }

  export interface SendMailResponse {
    request_id?: string;
    data?: unknown;
    message?: string;
  }

  export class SendMailClient {
    constructor(options: ClientParams, clientOption?: object);
    sendMail(options: Sendmail): Promise<SendMailResponse>;
    sendBatchMail(options: SendmailBatch): Promise<SendMailResponse>;
    sendMailWithTemplate(options: TemplateQueryParams): Promise<SendMailResponse>;
    mailBatchWithTemplate(options: TemplateBatchParams): Promise<SendMailResponse>;
  }
}
