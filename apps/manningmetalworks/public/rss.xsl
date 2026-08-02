<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <title>RSS Feed | <xsl:value-of select="/rss/channel/title"/></title>
        <style>
          body { font-family: sans-serif; padding: 0 20px; color: #333; }
          h1 { font-size: 1.8em; }
          .item { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
          .item-title { font-size: 1.4em; color: #0066cc; text-decoration: none; }
          .item-field { font-size: 1.0em; color: #666; display: block; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1>RSS Feed: <xsl:value-of select="/rss/channel/title"/></h1>
        <!-- Loop through each RSS item -->
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <a class="item-title" href="{link}">
              <xsl:value-of select="title"/>
            </a>
            <span class="item-field">Link: <xsl:value-of select="link"/></span>
            <span class="item-field">PubDate: <xsl:value-of select="pubDate"/></span>
            <span class="item-field">GUID: <xsl:value-of select="guid"/></span>
            <span class="item-field">Description: <xsl:value-of select="description"/></span>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>