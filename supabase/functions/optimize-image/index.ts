import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Aggressive image compression using canvas API
// Converts to JPEG with very low quality for maximum compression
async function compressImage(
  imageBuffer: ArrayBuffer, 
  mimeType: string,
  maxWidth: number = 1200,
  quality: number = 0.5
): Promise<{ buffer: Uint8Array; width: number; height: number }> {
  const { Image } = await import("https://deno.land/x/imagescript@1.3.0/mod.ts");
  
  try {
    const image = await Image.decode(new Uint8Array(imageBuffer));
    
    let width = image.width;
    let height = image.height;
    
    // Aggressive resize for web - max 1200px width
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
      image.resize(width, height);
    }
    
    // Use JPEG with very aggressive quality for maximum compression (80%+ reduction)
    // Quality 40-50% gives excellent compression while maintaining acceptable visual quality
    const jpegQuality = Math.round(quality * 100);
    const outputBuffer = await image.encodeJPEG(jpegQuality);
    
    console.log(`Compressed to JPEG: ${width}x${height}, quality: ${jpegQuality}%`);
    
    return {
      buffer: outputBuffer,
      width,
      height
    };
  } catch (error) {
    console.error('Image compression failed, returning original:', error);
    return {
      buffer: new Uint8Array(imageBuffer),
      width: 0,
      height: 0
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || file.name;
    const folder = formData.get('folder') as string || 'uploads';
    // Aggressive defaults: max 1200px width, 50% quality for 80%+ size reduction
    const maxWidth = parseInt(formData.get('maxWidth') as string) || 1200;
    const quality = parseFloat(formData.get('quality') as string) || 0.5;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process images
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'Only image files are supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing image: ${fileName}, size: ${file.size} bytes, type: ${file.type}`);

    const originalBuffer = await file.arrayBuffer();
    const originalSize = originalBuffer.byteLength;

    // Compress the image with aggressive settings
    const { buffer: compressedBuffer, width, height } = await compressImage(
      originalBuffer,
      file.type,
      maxWidth,
      quality
    );
    
    const compressedSize = compressedBuffer.byteLength;
    const reduction = Math.round((1 - compressedSize / originalSize) * 100);

    // Always output JPEG for maximum compression
    const outputMimeType = 'image/jpeg';
    const outputExt = 'jpg';
    
    // Sanitize filename - remove special characters that storage doesn't accept
    const sanitizedBaseName = fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length
    
    // Generate new filename with random suffix for uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const optimizedFileName = `${Date.now()}-${randomSuffix}-${sanitizedBaseName}.${outputExt}`;
    const filePath = `${folder}/${optimizedFileName}`;
    
    console.log(`Original: ${originalSize} bytes, Compressed: ${compressedSize} bytes, Reduction: ${reduction}%`);

    // Upload compressed image to storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, compressedBuffer, {
        contentType: outputMimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

    // Insert into media table
    const { error: insertError } = await supabase.from('media').insert({
      file_name: optimizedFileName,
      file_path: filePath,
      file_type: outputMimeType,
      file_size: compressedSize,
      public_url: urlData.publicUrl,
      folder: folder,
    });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Don't fail the request, file is already uploaded
    }

    return new Response(
      JSON.stringify({
        success: true,
        public_url: urlData.publicUrl,
        file_path: filePath,
        original_size: originalSize,
        compressed_size: compressedSize,
        reduction_percent: reduction,
        dimensions: width && height ? { width, height } : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
