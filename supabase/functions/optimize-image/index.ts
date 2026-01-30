import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Image compression using canvas in Deno
async function compressImage(
  imageBuffer: ArrayBuffer, 
  mimeType: string,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<{ buffer: Uint8Array; width: number; height: number }> {
  const { Image } = await import("https://deno.land/x/imagescript@1.3.0/mod.ts");
  
  try {
    const image = await Image.decode(new Uint8Array(imageBuffer));
    
    let width = image.width;
    let height = image.height;
    
    // Resize if larger than maxWidth
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
      image.resize(width, height);
    }
    
    // Encode based on mime type
    let outputBuffer: Uint8Array;
    
    if (mimeType === 'image/png') {
      outputBuffer = await image.encode(1); // PNG compression level
    } else {
      // Default to JPEG for better compression
      outputBuffer = await image.encodeJPEG(Math.round(quality * 100));
    }
    
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
    const maxWidth = parseInt(formData.get('maxWidth') as string) || 1920;
    const quality = parseFloat(formData.get('quality') as string) || 0.8;

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

    // Compress the image
    const { buffer: compressedBuffer, width, height } = await compressImage(
      originalBuffer,
      file.type,
      maxWidth,
      quality
    );
    
    const compressedSize = compressedBuffer.byteLength;
    const reduction = Math.round((1 - compressedSize / originalSize) * 100);

    // Determine output file type (convert to JPEG for better compression unless PNG)
    const isPng = file.type === 'image/png';
    const outputMimeType = isPng ? 'image/png' : 'image/jpeg';
    const outputExt = isPng ? 'png' : 'jpg';
    
    // Generate new filename
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const optimizedFileName = `${Date.now()}-${baseName}.${outputExt}`;
    const filePath = `${folder}/${optimizedFileName}`;

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
