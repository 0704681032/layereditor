import java.io.*;
import java.net.*;

public class DownloadGif {
    public static void main(String[] args) throws Exception {
        String[] urls = {
            "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
            "https://media.giphy.com/media/3o7btPC0Nmi1bQY5qY/giphy.gif",
            "https://gifimage.net/wp-content/uploads/2017/09/animated-gif-image-download-23.gif",
            "https://i.imgur.com/7MjKU.gif",
        };

        File dir = new File("network-test-images");
        dir.mkdirs();

        for (int i = 0; i < urls.length; i++) {
            try {
                System.out.println("Download: " + urls[i]);
                URL url = new URL(urls[i]);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 Chrome/120.0.0.0");
                conn.setRequestProperty("Accept", "image/gif,image/*,*/*");

                int code = conn.getResponseCode();
                System.out.println("  HTTP " + code);

                if (code == 200) {
                    String type = conn.getContentType();
                    System.out.println("  Type: " + type);

                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    InputStream is = conn.getInputStream();
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
                    is.close();

                    byte[] data = bos.toByteArray();
                    System.out.println("  Size: " + data.length + " bytes");

                    if (data.length >= 6) {
                        String header = String.format("%02X %02X %02X", data[0], data[1], data[2]);
                        System.out.println("  Header: " + header);

                        boolean isGif = data[0] == 0x47 && data[1] == 0x49 && data[2] == 0x46;
                        String ext = isGif ? ".gif" : ".jpg";
                        String filename = "gif_quality_" + (i+1) + ext;

                        FileOutputStream fos = new FileOutputStream(new File(dir, filename));
                        fos.write(data);
                        fos.close();
                        System.out.println("  Saved: " + filename);
                    }
                }
                conn.disconnect();
            } catch (Exception e) {
                System.out.println("  Error: " + e.getMessage());
            }
        }
    }
}