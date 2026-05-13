import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;

public class TestGif {
    public static void main(String[] args) throws Exception {
        String[] files = {"network-test-images/gif_quality_1.gif", "network-test-images/gif_quality_2.gif"};
        
        for (String f : files) {
            File file = new File(f);
            System.out.println("\n=== " + file.getName() + " ===");
            System.out.println("Size: " + file.length() + " bytes");
            
            // ImageUtils
            byte[] data = java.nio.file.Files.readAllBytes(file.toPath());
            com.example.editor.common.util.ImageUtils.Dimension dim = 
                com.example.editor.common.util.ImageUtils.getDimension(data);
            System.out.println("ImageUtils: " + dim.getWidth() + " x " + dim.getHeight());
            
            // ImageIO
            BufferedImage bi = ImageIO.read(file);
            if (bi != null) {
                System.out.println("ImageIO: " + bi.getWidth() + " x " + bi.getHeight());
                System.out.println("Match: " + (dim.getWidth() == bi.getWidth() && dim.getHeight() == bi.getHeight()));
            }
        }
    }
}
