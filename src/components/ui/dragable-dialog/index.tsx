import { motion } from "framer-motion";

interface DraggableDialogProps {
  children: React.ReactNode;
  onClose: () => void;
  isOpen: boolean;
}

export const DraggableDialog: React.FC<DraggableDialogProps> = ({
  children,
  onClose,
  isOpen,
}) => {
  return (
    <motion.div
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
      }}
    >
      {children}
    </motion.div>
  );
};

export default DraggableDialog;
