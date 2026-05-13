import java.util.regex.*;
public class TestRegex {
    public static void main(String[] args) {
        String content = "#define test_width 100\n#define test_height 50\n";
        String pattern = "#define\s+\S+?_width\s+(\d+)";
        Pattern p = Pattern.compile(pattern);
        Matcher m = p.matcher(content);
        System.out.println("Pattern: " + pattern);
        System.out.println("Content: " + content);
        if (m.find()) {
            System.out.println("Found! Value: " + m.group(1));
        } else {
            System.out.println("Not found");
        }
    }
}
